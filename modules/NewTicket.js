/*global $, ALGOLIA_API_KEY*/
import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import {FormGroup, ControlLabel, FormControl, Button, Tooltip, OverlayTrigger} from 'react-bootstrap'
import AV from 'leancloud-storage/live-query'
import docsearch from 'docsearch.js'

import TextareaWithPreview from './components/TextareaWithPreview'
import {defaultLeanCloudRegion, getLeanCloudRegionText} from '../lib/common'
import {uploadFiles, getCategoriesTree, depthFirstSearchFind, getTinyCategoryInfo, getTicketAcl, OrganizationSelect} from './common'

export default class NewTicket extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      categoriesTree: [],
      apps: [],
      isCommitting: false,
      title: '',
      appId: '',
      categoryPath: [],
      content: '',
    }
  }

  componentDidMount() {
    docsearch({
      apiKey: ALGOLIA_API_KEY,
      indexName: 'leancloud',
      inputSelector: '.docsearch-input',
      debug: false // Set debug to true if you want to inspect the dropdown
    })

    this.contentTextarea.addEventListener('paste', this.pasteEventListener.bind(this))
    AV.Cloud.run('checkPermission')
    .then(() => {
      return Promise.all([
        getCategoriesTree(),
        AV.Cloud.run('getLeanCloudApps')
        .catch((err) => {
          if (err.message.indexOf('Could not find LeanCloud authData:') === 0) {
            return []
          }
          throw err
        }),
      ])
    })
    .then(([categoriesTree, apps]) => {
      let {
        title=(localStorage.getItem('ticket:new:title') || ''),
        appId='',
        categoryIds=JSON.parse(localStorage.getItem('ticket:new:categoryIds') || '[]'),
        content=(localStorage.getItem('ticket:new:content') || '')
      } = this.props.location.query

      const categoryPath = _.compact(categoryIds.map(cid => depthFirstSearchFind(categoriesTree, c => c.id == cid)))
      const category = _.last(categoryPath)
      if (content === '' && category && category.get('qTemplate')) {
        content = category.get('qTemplate')
      }
      this.setState({
        categoriesTree, apps,
        title, appId, categoryPath, content,
      })
      return
    })
    .catch(this.context.addNotification)
  }

  componentWillUnmount() {
    this.contentTextarea.removeEventListener('paste', this.pasteEventListener.bind(this))
  }

  pasteEventListener(e) {
    if (e.clipboardData.types.indexOf('Files') != -1) {
      this.setState({isCommitting: true})
      return uploadFiles(e.clipboardData.files)
      .then((files) => {
        const content = `${this.state.content}\n<img src='${files[0].url()}' />`
        this.setState({isCommitting: false, content})
        return
      })
    }
  }

  handleTitleChange(e) {
    localStorage.setItem('ticket:new:title', e.target.value)
    this.setState({title: e.target.value})
  }

  handleCategoryChange(e, index) {
    const categoryPath = this.state.categoryPath.slice(0, index)

    const category = depthFirstSearchFind(this.state.categoriesTree, c => c.id === e.target.value)
    if (!category) {
      localStorage.setItem('ticket:new:categoryIds', JSON.stringify(categoryPath.map(c => c.id)))
      this.setState({categoryPath})
      return
    }

    categoryPath.push(category)
    if (this.state.content && category.get('qTemplate')) {
      if (confirm('当前「问题描述」不为空，所选「问题分类」的模板会覆盖现有描述。\n\n是否继续？')) {
        localStorage.setItem('ticket:new:categoryIds', JSON.stringify(categoryPath.map(c => c.id)))
        localStorage.setItem('ticket:new:content', category.get('qTemplate'))
        this.setState({categoryPath, content: category.get('qTemplate')})
        return
      } else {
        return false
      }
    }

    const content = category.get('qTemplate') || this.state.content || ''
    localStorage.setItem('ticket:new:categoryIds', JSON.stringify(categoryPath.map(c => c.id)))
    localStorage.setItem('ticket:new:content', content)
    this.setState({categoryPath, content})
  }

  handleAppChange(e) {
    this.setState({appId: e.target.value})
  }

  handleContentChange(e) {
    localStorage.setItem('ticket:new:content', e.target.value)
    this.setState({content: e.target.value})
  }

  handleSubmit(e) {
    e.preventDefault()

    if (!this.state.title || this.state.title.trim().length === 0) {
      this.context.addNotification(new Error('标题不能为空'))
      return
    }
    if (!this.state.categoryPath) {
      this.context.addNotification(new Error('问题分类不能为空'))
      return
    }
    if (_.last(this.state.categoryPath).children.length > 0) {
      this.context.addNotification(new Error('分类信息不完整'))
      return
    }

    this.setState({isCommitting: true})
    return uploadFiles($('#ticketFile')[0].files)
    .then((files) => {
      let org = null
      if (this.props.selectedOrgId && this.props.selectedOrgId.length > 0) {
        org = _.find(this.props.organizations, {id: this.props.selectedOrgId})
      }
      const ticket = new AV.Object('Ticket', {
        organization: _.find(this.props.organizations, {id: this.props.selectedOrgId}),
        title: this.state.title,
        category: getTinyCategoryInfo(_.last(this.state.categoryPath)),
        content: this.state.content,
        files,
        ACL: getTicketAcl(AV.User.current(), org),
      })
      return ticket.save()
      .then((ticket) => {
        if (this.state.appId) {
          return new AV.Object('Tag').save({
            key: 'appId',
            value: this.state.appId,
            ticket
          })
        }
        return
      })
    })
    .then(() => {
      this.setState({isCommitting: false})
      return
    })
    .then(() => {
      localStorage.removeItem('ticket:new:title')
      localStorage.removeItem('ticket:new:content')
      this.context.router.push('/tickets')
      return
    })
    .catch(this.context.addNotification)
  }

  render() {
    const getSelect = (categories, selectCategory, index) => {
      if (categories.length == 0) {
        return
      }

      const options = categories.map((category) => {
        return (
          <option key={category.id} value={category.id}>{category.get('name')}</option>
        )
      })
      return (
        <FormGroup key={'categorySelect' + index}>
          <ControlLabel>{index == 0 ? '问题分类：' : index + 1 + ' 级分类：'}</ControlLabel>
          <FormControl componentClass="select" value={selectCategory && selectCategory.id || ''} onChange={(e) => this.handleCategoryChange(e, index)}>
            <option key='empty'></option>
            {options}
          </FormControl>
        </FormGroup>
      )
    }

    const appOptions = this.state.apps.map((app) => {
      if (defaultLeanCloudRegion === app.region) {
        return <option key={app.app_id} value={app.app_id}>{app.app_name}</option>
      }
      return <option key={app.app_id} value={app.app_id}>{app.app_name} ({getLeanCloudRegionText(app.region)})</option>
    })

    const categorySelects = []
    for (let i = 0; i < this.state.categoryPath.length + 1; i++) {
      const selected = this.state.categoryPath[i]
      if (i == 0) {
        categorySelects.push(getSelect(this.state.categoriesTree, selected, i))
      } else {
        categorySelects.push(getSelect(this.state.categoryPath[i - 1].children, selected, i))
      }
    }

    const tooltip = (
      <Tooltip id="tooltip">支持 Markdown 语法</Tooltip>
    )
    const appTooltip = (
      <Tooltip id="appTooltip">如需显示北美和华东节点应用，请到帐号设置页面关联帐号</Tooltip>
    )
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          {this.props.organizations.length > 0 && <OrganizationSelect organizations={this.props.organizations}
            selectedOrgId={this.props.selectedOrgId}
            onOrgChange={this.props.handleOrgChange} />}
          <FormGroup>
            <ControlLabel>标题：</ControlLabel>
            <input type="text" className="form-control docsearch-input" value={this.state.title} 
               onChange={this.handleTitleChange.bind(this)} />
          </FormGroup>
          <FormGroup>
            <ControlLabel>
              相关应用 <OverlayTrigger placement="top" overlay={appTooltip}>
                <span className='icon-wrap'><span className='glyphicon glyphicon-question-sign'></span></span>
              </OverlayTrigger>
            </ControlLabel>
            <FormControl componentClass="select" value={this.state.appId} onChange={this.handleAppChange.bind(this)}>
              <option key='empty'></option>
              {appOptions}
            </FormControl>
          </FormGroup>
          {categorySelects}
          <FormGroup>
            <ControlLabel>
              问题描述： <OverlayTrigger placement="top" overlay={tooltip}>
                <b className="has-required" title="支持 Markdown 语法">M↓</b>
              </OverlayTrigger>
            </ControlLabel>
            <TextareaWithPreview componentClass="textarea" placeholder="在这里输入，粘贴图片即可上传。" rows="8"
              value={this.state.content}
              onChange={this.handleContentChange.bind(this)}
              inputRef={(ref) => this.contentTextarea = ref }
            />
          </FormGroup>
          <FormGroup>
            <input id="ticketFile" type="file" multiple />
          </FormGroup>
          <Button type='submit' disabled={this.state.isCommitting} bsStyle='primary'>提交</Button>
        </form>
      </div>
    )
  }

}

NewTicket.contextTypes = {
  router: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
}

NewTicket.propTypes = {
  location: PropTypes.object,
  organizations: PropTypes.array,
  handleOrgChange: PropTypes.func,
  selectedOrgId: PropTypes.string,
}

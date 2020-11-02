import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Form, FormGroup, ControlLabel, FormControl, Button} from 'react-bootstrap'

import {Avatar} from '../common'
import AccountLink from './AccountLink'
import translate from '../i18n/translate'

class Profile extends Component {

  constructor(props) {
    super(props)
    this.state = {
      name: this.props.currentUser.get('name'),
      email: this.props.currentUser.get('email'),
    }
  }

  componentDidMount() {
  }

  handleNameChange(e) {
    this.setState({name: e.target.value})
  }

  handleEmailChange(e) {
    this.setState({email: e.target.value})
  }

  handleSubmit(e) {
    e.preventDefault()
    return this.props.updateCurrentUser(this.state)
    .then(this.context.addNotification)
    .catch(this.context.addNotification)
  }

  render() {
    const {t} = this.props
    return <div>
      <div className="row">
        <div className="col-md-8">
          <h2>基本信息</h2>
          <Form>
            <FormGroup>
              <ControlLabel>{t('username')}</ControlLabel>
              <FormControl type="text" value={this.props.currentUser.get('username')} disabled='true' />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('nickname')}</ControlLabel>
              <FormControl type="text" value={this.state.name} onChange={this.handleNameChange.bind(this)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('email')}</ControlLabel>
              <FormControl type="text" value={this.state.email} onChange={this.handleEmailChange.bind(this)} />
            </FormGroup>
            <Button type='button' onClick={this.handleSubmit.bind(this)}>{t('save')}</Button>
          </Form>
          <AccountLink currentUser={this.props.currentUser} />
        </div>
        <div className="col-md-4">
          <Form>
            <FormGroup>
              <ControlLabel>{t('avatar')}</ControlLabel>
            </FormGroup>
            <Avatar height="200" width="200" user={this.props.currentUser} />
            <div>
              <span>{t('changeAvatar')} <a href={t('gravatarUrl')} target='_blank'>Gravatar</a></span>
            </div>
          </Form>
        </div>
      </div>
    </div>
  }

}

Profile.propTypes = {
  currentUser: PropTypes.object,
  updateCurrentUser: PropTypes.func,
  t: PropTypes.func
}

Profile.contextTypes = {
  addNotification: PropTypes.func.isRequired,
}

export default translate(Profile)
import { useMemo } from 'react';
import moment from 'moment';
import { keyBy, uniq } from 'lodash-es';
import { useCustomerServices } from '@/api/customer-service';
import { useGroups } from '@/api/group';
import { TicketSchema } from '@/api/ticket';
import { useUsers } from '@/api/user';
import { Checkbox, Table } from '@/components/antd';
import Status from '../TicketStatus';
import { CategoryPath, useGetCategoryPath } from '../TicketList';

const { Column } = Table;

function TicketLink({ ticket }: { ticket: TicketSchema }) {
  return (
    <a className="mt-1.5 font-bold max-w-full" title={ticket.title} href={`/tickets/${ticket.nid}`}>
      <span>{ticket.title}</span>
      <span className="ml-1 text-[#6f7c87]">#{ticket.nid}</span>
    </a>
  );
}

export interface TicketTableProps {
  loading?: boolean;
  tickets?: TicketSchema[];
  checkedIds: string[];
  onChangeChecked: (id: string, checked: boolean) => void;
}

export function TicketTable({ loading, tickets, checkedIds, onChangeChecked }: TicketTableProps) {
  const checkedIdSet = useMemo(() => new Set(checkedIds), [checkedIds]);

  const userIds = useMemo(() => (tickets ? uniq(tickets.map((t) => t.authorId)) : []), [tickets]);
  const { data: users, isLoading: loadingUsers } = useUsers({
    id: userIds,
    queryOptions: {
      enabled: userIds.length > 0,
      staleTime: 1000 * 60,
    },
  });
  const userById = useMemo(() => keyBy(users, 'id'), [users]);

  const getCategoryPath = useGetCategoryPath();

  const { data: groups, isLoading: loadingGroups } = useGroups();
  const groupById = useMemo(() => keyBy(groups, 'id'), [groups]);

  const { data: assignees, isLoading: loadingAssignees } = useCustomerServices();
  const assigneeById = useMemo(() => keyBy(assignees, 'id'), [assignees]);

  return (
    <Table
      className="min-w-[1000px]"
      rowKey="id"
      loading={loading}
      dataSource={tickets}
      pagination={false}
    >
      <Column
        className="w-0"
        dataIndex="id"
        render={(id: string) => (
          <Checkbox
            checked={checkedIdSet.has(id)}
            onChange={(e) => onChangeChecked(id, e.target.checked)}
          />
        )}
      />

      <Column
        dataIndex="status"
        title="状态"
        render={(status: number) => <Status status={status} />}
      />

      <Column
        key="title"
        title="标题"
        render={(ticket: TicketSchema) => <TicketLink ticket={ticket} />}
      />

      <Column
        dataIndex="categoryId"
        title="分类"
        render={(id: string) => (
          <CategoryPath className="whitespace-nowrap text-sm" path={getCategoryPath(id)} />
        )}
      />

      <Column
        dataIndex="groupId"
        title="组"
        render={(groupId?: string) =>
          groupId ? (loadingGroups ? 'Loading...' : groupById[groupId]?.name ?? 'unknown') : '--'
        }
      />

      <Column
        dataIndex="assigneeId"
        title="客服"
        render={(assigneeId?: string) =>
          assigneeId
            ? loadingAssignees
              ? 'Loading...'
              : assigneeById[assigneeId]?.nickname ?? 'unknown'
            : '--'
        }
      />

      <Column
        dataIndex="authorId"
        title="创建人"
        render={(authorId: string) =>
          loadingUsers ? 'Loading' : userById[authorId]?.nickname ?? 'unknown'
        }
      />

      <Column
        title="创建时间"
        dataIndex="createdAt"
        render={(data: string) => (
          <span title={new Date(data).toLocaleString()}>{moment(data).fromNow()}</span>
        )}
      />
    </Table>
  );
}

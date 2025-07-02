import { ConversationList } from '@/components/conversations/conversation-list'

export default function ConversationsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Conversas</h1>
      <ConversationList />
    </div>
  )
}
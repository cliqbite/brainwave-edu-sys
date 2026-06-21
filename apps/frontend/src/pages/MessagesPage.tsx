import { useState } from 'react';
import { Card, Input, Button, Select, showToast } from '../components/ui';
import { messagesApi } from '../api/endpoints';
import { MessageSquare, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../api/endpoints';

const MessagesPage = () => {
  const [title, setTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');
  const [recipientType, setRecipientType] = useState('ALL');
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);

  const { data: groupsData } = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsApi.list({ limit: 100 }), // Get all groups for selection
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody) {
      showToast.error('Message content is required');
      return;
    }
    if (recipientType === 'GROUP' && groupIds.length === 0) {
      showToast.error('Please select at least one group');
      return;
    }

    setIsSending(true);
    try {
      await messagesApi.broadcast({
        title: title || undefined,
        messageBody,
        channel,
        recipientType,
        groupIds: recipientType === 'GROUP' ? groupIds : undefined,
      });
      showToast.success('Broadcast campaign created and queued');
      setTitle('');
      setMessageBody('');
    } catch (err: any) {
      showToast.error(err.message || 'Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  const groupOptions = groupsData?.data?.map((g: any) => ({
    value: g.id,
    label: g.name,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <MessageSquare size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">New Broadcast</h1>
          <p className="text-muted">Send WhatsApp messages to students and staff</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSend} className="space-y-6">
          <Input 
            label="Campaign Title (Internal)" 
            placeholder="e.g. Exam Schedule Announcement" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select
            label="Communication Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            options={[
              { value: 'WHATSAPP', label: 'WhatsApp Only' },
              { value: 'PUSH', label: 'Web Push Only' },
              { value: 'BOTH', label: 'Both WhatsApp & Web Push' },
            ]}
          />

          <Select
            label="Recipient Type"
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Active Users' },
              { value: 'GROUP', label: 'Specific Groups' },
            ]}
          />

          {recipientType === 'GROUP' && (
            <div className="form-group">
              <label className="form-label">Select Group</label>
              <select 
                className="form-input"
                onChange={(e) => setGroupIds([parseInt(e.target.value)])}
                value={groupIds[0] || ''}
              >
                <option value="" disabled>Select a group...</option>
                {groupOptions.map((opt: any) => (
                  <option key={opt.value} value={opt.value} className="bg-elevated text-primary">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Message Content</label>
            <textarea 
              className="form-input min-h-[150px] resize-y"
              placeholder="Type your message here... Use {name} for personalization."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              required
            ></textarea>
            <p className="text-xs text-muted mt-2">
              Available variables: <code className="px-1 py-0.5 bg-black/20 rounded">{"{name}"}</code>, <code className="px-1 py-0.5 bg-black/20 rounded">{"{email}"}</code>
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <Button type="submit" isLoading={isSending} leftIcon={<Send size={18} />}>
              Send Broadcast
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MessagesPage;

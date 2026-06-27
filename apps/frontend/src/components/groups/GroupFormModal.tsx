import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal, Input, Button, showToast } from '../ui';
import { groupsApi } from '../../api/endpoints';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group?: any; // If provided, we are editing. If null, creating.
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({ isOpen, onClose, onSuccess, group }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [group, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: any) => group ? groupsApi.update(group.id, data) : groupsApi.create(data),
    onSuccess: () => {
      showToast.success(`Group ${group ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      showToast.error(err.message || `Failed to ${group ? 'update' : 'create'} group`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast.error('Group name is required');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={group ? 'Edit Group' : 'Create Group'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Group Name"
            placeholder="e.g. Science Class 10A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="form-label block mb-1">Description (Optional)</label>
          <textarea
            className="form-input min-h-[100px] resize-y"
            placeholder="What is this group for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : group ? 'Save Changes' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

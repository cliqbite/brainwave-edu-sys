import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Input, Button, Select, showToast } from '../ui';
import { usersApi, rolesApi } from '../../api/endpoints';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any; // null if adding new
}

export const UserFormModal = ({ isOpen, onClose, user }: UserFormModalProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
  });

  const { data: rolesData, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        roleId: user.role?.id?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        roleId: '',
      });
    }
  }, [user, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: any) => 
      isEditing ? usersApi.update(user.id, data) : usersApi.create({ ...data, password: 'Password@123' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast.success(isEditing ? 'User updated successfully' : 'User created successfully');
      onClose();
    },
    onError: (err: any) => {
      showToast.error(err.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.roleId) {
      showToast.error('Please fill in all required fields');
      return;
    }
    
    mutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      roleId: parseInt(formData.roleId),
    });
  };

  const roleOptions = [
    { value: '', label: loadingRoles ? 'Loading roles...' : 'Select a role', disabled: true },
    ...(rolesData?.data || []).map((r: any) => ({
      value: r.id.toString(),
      label: r.displayName,
    }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Add User'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Full Name *</label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            placeholder="e.g. Jane Doe"
            required
          />
        </div>
        <div>
          <label className="form-label">Email Address *</label>
          <Input 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            placeholder="e.g. jane@example.com"
            required
          />
        </div>
        <div>
          <label className="form-label">Phone Number</label>
          <Input 
            value={formData.phone} 
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
            placeholder="e.g. +1 234 567 8900"
          />
        </div>
        <div>
          <label className="form-label">Role *</label>
          <Select
            value={formData.roleId}
            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            options={roleOptions}
            disabled={loadingRoles}
          />
        </div>
        
        {!isEditing && (
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg text-sm text-brand-300">
            <strong>Note:</strong> New users will be created with the default password: <code>Password@123</code>.
            They will be required to change it on their first login.
          </div>
        )}
      </form>
    </Modal>
  );
};

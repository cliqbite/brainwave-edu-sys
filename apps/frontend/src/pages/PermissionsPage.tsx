import { Card, EmptyState } from '../components/ui';
import { KeyRound, Construction } from 'lucide-react';

const PermissionsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
          <KeyRound size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Permissions</h1>
          <p className="text-muted">Manage roles and permissions mapping</p>
        </div>
      </div>

      <Card>
        <EmptyState 
          icon={<Construction size={48} className="text-muted opacity-50 mb-4" />}
          title="Under Development"
          description="This view is currently being built."
        />
      </Card>
    </div>
  );
};

export default PermissionsPage;

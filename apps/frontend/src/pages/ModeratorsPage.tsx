import { Card, EmptyState } from '../components/ui';
import { ShieldAlert, Construction } from 'lucide-react';

const ModeratorsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Moderators</h1>
          <p className="text-muted">Manage system moderators</p>
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

export default ModeratorsPage;

import { Card, EmptyState } from '../components/ui';
import { Settings, Wrench } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-slate-500/10 text-slate-500 rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted">Configure application preferences</p>
        </div>
      </div>

      <Card>
        <EmptyState 
          icon={<Wrench size={48} className="text-muted opacity-50 mb-4" />}
          title="Under Development"
          description="Settings panel is currently being built. Check back later."
        />
      </Card>
    </div>
  );
};

export default SettingsPage;

export const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="text-9xl font-bold text-[rgba(255,255,255,0.05)] select-none">404</div>
      <h1 className="text-2xl font-semibold mt-8 mb-2">Page Not Found</h1>
      <p className="text-muted mb-8 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
      <a href="/dashboard" className="btn btn-primary">Back to Dashboard</a>
    </div>
  );
};

export default NotFoundPage;

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-[2rem] bg-gray-100/80" />
        ))}
      </div>
      <div className="h-64 rounded-[2rem] bg-gray-100/80" />
      <div className="h-48 rounded-[2rem] bg-gray-100/80" />
    </div>
  );
}

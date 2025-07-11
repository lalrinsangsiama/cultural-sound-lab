export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
            CSL
          </h1>
          <p className="text-gray-600 mt-2">Cultural Sound Lab</p>
        </div>
        {children}
      </div>
    </div>
  );
}
export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Cultural Sound Lab</h1>
        <p className="text-xl">Test page to verify the server is working</p>
        <div className="mt-8">
          <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}
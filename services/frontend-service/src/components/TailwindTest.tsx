export default function TailwindTest() {
  return (
    <div className="p-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">Tailwind Test</h2>
      <p className="text-sm">If you can see this styled correctly, Tailwind is working!</p>
      <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100 transition-colors">
        Test Button
      </button>
    </div>
  );
}
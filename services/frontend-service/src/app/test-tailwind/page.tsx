export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Tailwind CSS Test Page
        </h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">
              Primary Colors
            </h2>
            <div className="space-y-2">
              <div className="w-full h-8 bg-primary-50 rounded flex items-center px-3 text-sm">primary-50</div>
              <div className="w-full h-8 bg-primary-500 rounded flex items-center px-3 text-sm text-white">primary-500</div>
              <div className="w-full h-8 bg-primary-600 rounded flex items-center px-3 text-sm text-white">primary-600</div>
              <div className="w-full h-8 bg-primary-700 rounded flex items-center px-3 text-sm text-white">primary-700</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Typography
            </h2>
            <div className="space-y-2">
              <p className="text-reading-sm">Reading Small (16px/24px)</p>
              <p className="text-reading-base">Reading Base (18px/28px)</p>
              <p className="text-reading-lg">Reading Large (20px/32px)</p>
              <p className="text-reading-xl">Reading XL (22px/36px)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Responsive Test
            </h2>
            <div className="bg-red-200 sm:bg-yellow-200 md:bg-green-200 lg:bg-blue-200 xl:bg-purple-200 p-4 rounded">
              <p className="text-sm">
                This box changes color based on screen size:
                <br />
                <span className="font-mono">
                  red (xs) → yellow (sm) → green (md) → blue (lg) → purple (xl)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Button Components Test
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Primary Button
            </button>
            <button className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              Secondary Button
            </button>
            <button className="border-2 border-primary-600 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
              Outline Button
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Mobile-First Grid Test
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-100 p-4 rounded text-center">1</div>
            <div className="bg-primary-200 p-4 rounded text-center">2</div>
            <div className="bg-primary-300 p-4 rounded text-center">3</div>
            <div className="bg-primary-400 p-4 rounded text-center text-white">4</div>
          </div>
        </div>
      </div>
    </div>
  );
}
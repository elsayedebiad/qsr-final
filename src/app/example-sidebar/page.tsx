'use client'

import ProSidebar from '../../components/ProSidebar'

export default function ExampleSidebarPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ProSidebar />
      
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Professional Sidebar Demo
          </h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>✅ Collapsible sidebar with smooth animations</li>
              <li>✅ Mobile-friendly with overlay</li>
              <li>✅ Professional custom scrollbar</li>
              <li>✅ Active state indicators</li>
              <li>✅ Badge notifications</li>
              <li>✅ Tooltips in collapsed mode</li>
              <li>✅ Responsive design</li>
              <li>✅ TypeScript support</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Scrollbar Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>🎨 Thin and minimal design</li>
              <li>🎨 Gray transparent color</li>
              <li>🎨 Becomes more visible on hover</li>
              <li>🎨 Rounded corners</li>
              <li>🎨 Cross-browser compatible</li>
              <li>🎨 Smooth scrolling enabled</li>
            </ul>
          </div>

          {/* Add some content to test scrolling */}
          <div className="mt-8 space-y-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-gray-800">Content Block {i + 1}</h3>
                <p className="text-gray-600 mt-2">
                  This is some sample content to demonstrate the layout with the sidebar. 
                  The sidebar should remain fixed while this content scrolls.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * Resources Page
 * ===============
 * Additional game resources including downloadable PDFs
 */

import { Download, FileText, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export default function ResourcesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Resources</h1>
      
      <p className="text-center text-gray-600 mb-10">
        Welcome to the Resources page. Here you can find various tools, downloads, and references 
        to enhance your Realms RPG experience. More resources will be added over time!
      </p>

      <div className="space-y-8">
        {/* Character Sheet PDF - Primary Resource */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Printable Character Sheet</h2>
              <p className="text-gray-600 mb-4">
                Download the official Realms Character Sheet Alpha for easy character creation 
                and tracking during gameplay.
              </p>
              <Link 
                href="/Realms Character Sheet Alpha.pdf"
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md"
              >
                <Download className="w-5 h-5" />
                Click here to download
              </Link>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-gray-600">
              <BookOpen className="w-5 h-5 text-gray-400" />
              Quick Reference Guides
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <FileText className="w-5 h-5 text-gray-400" />
              Adventure Modules
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5 text-gray-400" />
              Community Creations
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

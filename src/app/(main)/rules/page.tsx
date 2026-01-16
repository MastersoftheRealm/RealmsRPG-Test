/**
 * Rules Page
 * ===========
 * Core rulebook embedded from Google Docs
 */

export default function RulesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Core Rulebook Alpha</h1>
      
      <p className="text-center text-gray-600 mb-6">
        Scroll through or use Ctrl+F to find the desired rule or reference you&apos;re looking for! Enjoy playing!
      </p>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <iframe 
          src="https://docs.google.com/document/d/e/2PACX-1vR2In0Fvu9axM9bb85Ne2rSp5SEfBd3kA34a3IHtcR5fIJ4spxCVgWezaNtejtyaGGmLtG-WTTKbgbE/pub?embedded=true" 
          className="w-full border-0"
          style={{ height: '800px' }}
          allowFullScreen
          title="Realms RPG Core Rulebook"
        />
      </div>
    </div>
  );
}

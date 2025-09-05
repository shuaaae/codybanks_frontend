import React from 'react';
import bgImg from '../../assets/bg.jpg';

export default function DraftFinished({
  blueTeamName = 'Team Blue',
  redTeamName = 'Team Red',
  bans,
  picks,
  heroList = []
}) {
  // Debug logging
  console.log('DraftFinished rendering with:', {
    blueTeamName,
    redTeamName,
    bans,
    picks,
    heroListLength: heroList.length
  });
  // Helper function to get hero data by name
  const getHeroData = (heroName) => {
    if (!heroName) return null;
    return heroList.find(hero => hero.name === heroName);
  };

  // Helper function to get hero image URL
  const getHeroImageUrl = (heroName) => {
    const hero = getHeroData(heroName);
    if (!hero) return null;
    return `${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`;
  };

  // Fallback image component
  const HeroImage = ({ heroName, className, alt }) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    
    const imageUrl = getHeroImageUrl(heroName);
    
    if (!imageUrl || imageError) {
      return (
        <div className={`${className} bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-xs`}>
          {heroName ? heroName.charAt(0).toUpperCase() : '?'}
        </div>
      );
    }
    
    return (
      <img
        src={imageUrl}
        alt={alt || heroName}
        className={className}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
    );
  };

  // Helper function to get role label
  const getRoleLabel = (role) => {
    const roleMap = {
      'exp': 'EXPLANER',
      'jungler': 'JUNGLER', 
      'mid': 'MIDLANER',
      'gold': 'GOLDLANER',
      'roam': 'ROAMER'
    };
    return roleMap[role] || role?.toUpperCase();
  };

  return (
    <div className="draft-finished-container">
      <div 
        className="relative w-[1200px] h-[800px] rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl"
        style={{
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Title */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
          <h1 className="text-white text-4xl font-bold text-center drop-shadow-lg">Draft Finished</h1>
        </div>

        {/* Team Blue Section */}
        <div className="absolute left-8 top-24 z-20">
          {/* Team Blue Button */}
          <div className="mb-8">
            <div className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg border-2 border-blue-400">
              {blueTeamName}
            </div>
          </div>

          {/* Blue Team Bans */}
          <div className="flex gap-3 mb-6">
            {bans.blue.map((heroName, index) => (
              <div key={index} className="relative">
                {heroName ? (
                  <>
                    <HeroImage
                      heroName={heroName}
                      className="w-14 h-14 rounded-full border-3 border-gray-500 shadow-lg"
                      alt={heroName}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-red-400">
                        <span className="text-white font-bold text-xl">×</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-14 h-14 rounded-full border-3 border-gray-500 bg-gray-800 shadow-lg"></div>
                )}
              </div>
            ))}
          </div>

          {/* Blue Team Picks */}
          <div className="space-y-4">
            {picks.blue.map((heroName, index) => (
              <div key={index} className="flex items-center gap-4">
                {heroName ? (
                  <>
                    <HeroImage
                      heroName={heroName}
                      className="w-20 h-20 rounded-full border-3 border-blue-400 shadow-xl"
                      alt={heroName}
                    />
                    <div className="text-white">
                      <div className="text-sm font-semibold text-blue-200 drop-shadow-md">
                        {getRoleLabel(getHeroData(heroName)?.role)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-20 h-20 rounded-full border-3 border-gray-500 bg-gray-800 shadow-xl"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team Red Section */}
        <div className="absolute right-8 top-24 z-20">
          {/* Team Red Button */}
          <div className="mb-8">
            <div className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg border-2 border-red-400">
              {redTeamName}
            </div>
          </div>

          {/* Red Team Bans */}
          <div className="flex gap-3 mb-6">
            {bans.red.map((heroName, index) => (
              <div key={index} className="relative">
                {heroName ? (
                  <>
                    <HeroImage
                      heroName={heroName}
                      className="w-14 h-14 rounded-full border-3 border-gray-500 shadow-lg"
                      alt={heroName}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-red-400">
                        <span className="text-white font-bold text-xl">×</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-14 h-14 rounded-full border-3 border-gray-500 bg-gray-800 shadow-lg"></div>
                )}
              </div>
            ))}
          </div>

          {/* Red Team Picks */}
          <div className="space-y-4">
            {picks.red.map((heroName, index) => (
              <div key={index} className="flex items-center gap-4">
                {heroName ? (
                  <>
                    <HeroImage
                      heroName={heroName}
                      className="w-20 h-20 rounded-full border-3 border-red-400 shadow-xl"
                      alt={heroName}
                    />
                    <div className="text-white">
                      <div className="text-sm font-semibold text-red-200 drop-shadow-md">
                        {getRoleLabel(getHeroData(heroName)?.role)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-20 h-20 rounded-full border-3 border-gray-500 bg-gray-800 shadow-xl"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Central Panel - Hero Selection Interface */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-[900px] h-[480px] rounded-2xl bg-gradient-to-br from-[#181A20cc] via-[#23232acc] to-[#181A20cc] flex flex-col items-center justify-center border border-gray-600 shadow-2xl">
            {/* Category Tabs */}
            <div className="flex gap-6 mb-6">
              <div className="text-white text-lg font-semibold px-4 py-2 border-b-2 border-blue-400">All</div>
              <div className="text-gray-400 text-lg font-semibold px-4 py-2">Assassin</div>
              <div className="text-gray-400 text-lg font-semibold px-4 py-2">Fighter</div>
              <div className="text-gray-400 text-lg font-semibold px-4 py-2">Mage</div>
              <div className="text-gray-400 text-lg font-semibold px-4 py-2">Marksman</div>
              <div className="text-gray-400 text-lg font-semibold px-4 py-2">Support</div>
              <div className="text-gray-400 text-lg font-semibold px-4 py-2">Tank</div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search hero..."
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                disabled
              />
            </div>

            {/* Hero Grid Placeholder */}
            <div className="grid grid-cols-10 gap-3 max-h-64 overflow-hidden">
              {Array.from({ length: 30 }).map((_, index) => (
                <div key={index} className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-600"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

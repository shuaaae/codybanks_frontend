import expIcon from '../../assets/exp.png';
import midIcon from '../../assets/mid.png';
import junglerIcon from '../../assets/jungle.png';
import goldIcon from '../../assets/gold.png';
import roamIcon from '../../assets/roam.png';
import defaultPlayer from '../../assets/default.png';

export const LANES = [
  { key: 'exp', label: 'EXPLANE', icon: expIcon },
  { key: 'mid', label: 'MIDLANER', icon: midIcon },
  { key: 'jungler', label: 'JUNGLER', icon: junglerIcon },
  { key: 'gold', label: 'GOLD LANE', icon: goldIcon },
  { key: 'roam', label: 'ROAMER', icon: roamIcon },
];

export const PLAYER = {
  name: 'Player',
  photo: defaultPlayer,
};

// Custom CSS for hiding scrollbars
export const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
`; 
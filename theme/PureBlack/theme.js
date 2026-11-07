// PureBlack: a pure-black Spotify whose colors come from the real sky where
// this Mac is. theme.js works out today's sun from the system timezone and
// fetches the current weather; the top bar shows that sky, and the rest of
// the app takes its accent and a wash of its color from it, with the weather
// playing on the panels' glass. color.ini holds the night purple, which
// stays as the fallback if this script doesn't run.
(function pureBlackSky() {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const trip = (c) => c.map(Math.round).join(",");
  const smooth = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };

  // Keeps keyframe hours in order and inside the day, for very short or
  // very long days.
  function monotonic(frames) {
    let previous = -Infinity;
    return frames.map(([hour, ...rest]) => {
      hour = Math.min(24, Math.max(0, hour, previous + 0.05));
      previous = hour;
      return [hour, ...rest];
    });
  }

  // Timezone -> [latitude, longitude], from macOS's zone.tab.
  const ZONES = "Europe/Andorra:42.5,1.5;Asia/Dubai:25.3,55.3;Asia/Kabul:34.5,69.2;America/Antigua:17.1,-61.8;America/Anguilla:18.2,-63.1;Europe/Tirane:41.3,19.8;Asia/Yerevan:40.2,44.5;Africa/Luanda:-8.8,13.2;Antarctica/McMurdo:-77.8,166.6;Antarctica/Casey:-66.3,110.5;Antarctica/Davis:-68.6,78.0;Antarctica/DumontDUrville:-66.7,140.0;Antarctica/Mawson:-67.6,62.9;Antarctica/Palmer:-64.8,-64.1;Antarctica/Rothera:-67.6,-68.1;Antarctica/Syowa:-69.0,39.6;Antarctica/Troll:-72.0,2.5;Antarctica/Vostok:-78.4,106.9;America/Argentina/Buenos_Aires:-34.6,-58.5;America/Argentina/Cordoba:-31.4,-64.2;America/Argentina/Salta:-24.8,-65.4;America/Argentina/Jujuy:-24.2,-65.3;America/Argentina/Tucuman:-26.8,-65.2;America/Argentina/Catamarca:-28.5,-65.8;America/Argentina/La_Rioja:-29.4,-66.8;America/Argentina/San_Juan:-31.5,-68.5;America/Argentina/Mendoza:-32.9,-68.8;America/Argentina/San_Luis:-33.3,-66.3;America/Argentina/Rio_Gallegos:-51.6,-69.2;America/Argentina/Ushuaia:-54.8,-68.3;Pacific/Pago_Pago:-14.3,-170.7;Europe/Vienna:48.2,16.3;Australia/Lord_Howe:-31.6,159.1;Antarctica/Macquarie:-54.5,158.9;Australia/Hobart:-42.9,147.3;Australia/Melbourne:-37.8,145.0;Australia/Sydney:-33.9,151.2;Australia/Broken_Hill:-31.9,141.4;Australia/Brisbane:-27.5,153.0;Australia/Lindeman:-20.3,149.0;Australia/Adelaide:-34.9,138.6;Australia/Darwin:-12.5,130.8;Australia/Perth:-31.9,115.8;Australia/Eucla:-31.7,128.9;America/Aruba:12.5,-70.0;Europe/Mariehamn:60.1,19.9;Asia/Baku:40.4,49.9;Europe/Sarajevo:43.9,18.4;America/Barbados:13.1,-59.6;Asia/Dhaka:23.7,90.4;Europe/Brussels:50.8,4.3;Africa/Ouagadougou:12.4,-1.5;Europe/Sofia:42.7,23.3;Asia/Bahrain:26.4,50.6;Africa/Bujumbura:-3.4,29.4;Africa/Porto-Novo:6.5,2.6;America/St_Barthelemy:17.9,-62.9;Atlantic/Bermuda:32.3,-64.8;Asia/Brunei:4.9,114.9;America/La_Paz:-16.5,-68.2;America/Kralendijk:12.2,-68.3;America/Noronha:-3.9,-32.4;America/Belem:-1.4,-48.5;America/Fortaleza:-3.7,-38.5;America/Recife:-8.1,-34.9;America/Araguaina:-7.2,-48.2;America/Maceio:-9.7,-35.7;America/Bahia:-13.0,-38.5;America/Sao_Paulo:-23.5,-46.6;America/Campo_Grande:-20.4,-54.6;America/Cuiaba:-15.6,-56.1;America/Santarem:-2.4,-54.9;America/Porto_Velho:-8.8,-63.9;America/Boa_Vista:2.8,-60.7;America/Manaus:-3.1,-60.0;America/Eirunepe:-6.7,-69.9;America/Rio_Branco:-10.0,-67.8;America/Nassau:25.1,-77.3;Asia/Thimphu:27.5,89.7;Africa/Gaborone:-24.6,25.9;Europe/Minsk:53.9,27.6;America/Belize:17.5,-88.2;America/St_Johns:47.6,-52.7;America/Halifax:44.6,-63.6;America/Glace_Bay:46.2,-60.0;America/Moncton:46.1,-64.8;America/Goose_Bay:53.3,-60.4;America/Blanc-Sablon:51.4,-57.1;America/Toronto:43.6,-79.4;America/Iqaluit:63.7,-68.5;America/Atikokan:48.8,-91.6;America/Winnipeg:49.9,-97.2;America/Resolute:74.7,-94.8;America/Rankin_Inlet:62.8,-92.1;America/Regina:50.4,-104.7;America/Swift_Current:50.3,-107.8;America/Edmonton:53.5,-113.5;America/Cambridge_Bay:69.1,-105.1;America/Inuvik:68.3,-133.7;America/Vancouver:49.3,-123.1;America/Creston:49.1,-116.5;America/Dawson_Creek:55.8,-120.2;America/Fort_Nelson:58.8,-122.7;America/Whitehorse:60.7,-135.1;America/Dawson:64.1,-139.4;Indian/Cocos:-12.2,96.9;Africa/Kinshasa:-4.3,15.3;Africa/Lubumbashi:-11.7,27.5;Africa/Bangui:4.4,18.6;Africa/Brazzaville:-4.3,15.3;Europe/Zurich:47.4,8.5;Africa/Abidjan:5.3,-4.0;Pacific/Rarotonga:-21.2,-159.8;America/Santiago:-33.5,-70.7;America/Coyhaique:-45.6,-72.1;America/Punta_Arenas:-53.1,-70.9;Pacific/Easter:-27.1,-109.4;Africa/Douala:4.0,9.7;Asia/Shanghai:31.2,121.5;Asia/Urumqi:43.8,87.6;America/Bogota:4.6,-74.1;America/Costa_Rica:9.9,-84.1;America/Havana:23.1,-82.4;Atlantic/Cape_Verde:14.9,-23.5;America/Curacao:12.2,-69.0;Indian/Christmas:-10.4,105.7;Asia/Nicosia:35.2,33.4;Asia/Famagusta:35.1,34.0;Europe/Prague:50.1,14.4;Europe/Berlin:52.5,13.4;Europe/Busingen:47.7,8.7;Africa/Djibouti:11.6,43.1;Europe/Copenhagen:55.7,12.6;America/Dominica:15.3,-61.4;America/Santo_Domingo:18.5,-69.9;Africa/Algiers:36.8,3.0;America/Guayaquil:-2.2,-79.8;Pacific/Galapagos:-0.9,-89.6;Europe/Tallinn:59.4,24.8;Africa/Cairo:30.1,31.2;Africa/El_Aaiun:27.1,-13.2;Africa/Asmara:15.3,38.9;Europe/Madrid:40.4,-3.7;Africa/Ceuta:35.9,-5.3;Atlantic/Canary:28.1,-15.4;Africa/Addis_Ababa:9.0,38.7;Europe/Helsinki:60.2,25.0;Pacific/Fiji:-18.1,178.4;Atlantic/Stanley:-51.7,-57.9;Pacific/Chuuk:7.4,151.8;Pacific/Pohnpei:7.0,158.2;Pacific/Kosrae:5.3,163.0;Atlantic/Faroe:62.0,-6.8;Europe/Paris:48.9,2.3;Africa/Libreville:0.4,9.4;Europe/London:51.5,-0.1;America/Grenada:12.1,-61.8;Asia/Tbilisi:41.7,44.8;America/Cayenne:4.9,-52.3;Europe/Guernsey:49.5,-2.5;Africa/Accra:5.5,-0.2;Europe/Gibraltar:36.1,-5.3;America/Nuuk:64.2,-51.7;America/Danmarkshavn:76.8,-18.7;America/Scoresbysund:70.5,-22.0;America/Thule:76.6,-68.8;Africa/Banjul:13.5,-16.6;Africa/Conakry:9.5,-13.7;America/Guadeloupe:16.2,-61.5;Africa/Malabo:3.8,8.8;Europe/Athens:38.0,23.7;Atlantic/South_Georgia:-54.3,-36.5;America/Guatemala:14.6,-90.5;Pacific/Guam:13.5,144.8;Africa/Bissau:11.8,-15.6;America/Guyana:6.8,-58.2;Asia/Hong_Kong:22.3,114.2;America/Tegucigalpa:14.1,-87.2;Europe/Zagreb:45.8,16.0;America/Port-au-Prince:18.5,-72.3;Europe/Budapest:47.5,19.1;Asia/Jakarta:-6.2,106.8;Asia/Pontianak:-0.0,109.3;Asia/Makassar:-5.1,119.4;Asia/Jayapura:-2.5,140.7;Europe/Dublin:53.3,-6.2;Asia/Jerusalem:31.8,35.2;Europe/Isle_of_Man:54.1,-4.5;Asia/Kolkata:22.5,88.4;Indian/Chagos:-7.3,72.4;Asia/Baghdad:33.4,44.4;Asia/Tehran:35.7,51.4;Atlantic/Reykjavik:64.2,-21.9;Europe/Rome:41.9,12.5;Europe/Jersey:49.2,-2.1;America/Jamaica:18.0,-76.8;Asia/Amman:31.9,35.9;Asia/Tokyo:35.7,139.7;Africa/Nairobi:-1.3,36.8;Asia/Bishkek:42.9,74.6;Asia/Phnom_Penh:11.6,104.9;Pacific/Tarawa:1.4,173.0;Pacific/Kanton:-2.8,-171.7;Pacific/Kiritimati:1.9,-157.3;Indian/Comoro:-11.7,43.3;America/St_Kitts:17.3,-62.7;Asia/Pyongyang:39.0,125.8;Asia/Seoul:37.5,127.0;Asia/Kuwait:29.3,48.0;America/Cayman:19.3,-81.4;Asia/Almaty:43.2,77.0;Asia/Qyzylorda:44.8,65.5;Asia/Qostanay:53.2,63.6;Asia/Aqtobe:50.3,57.2;Asia/Aqtau:44.5,50.3;Asia/Atyrau:47.1,51.9;Asia/Oral:51.2,51.4;Asia/Vientiane:18.0,102.6;Asia/Beirut:33.9,35.5;America/St_Lucia:14.0,-61.0;Europe/Vaduz:47.1,9.5;Asia/Colombo:6.9,79.8;Africa/Monrovia:6.3,-10.8;Africa/Maseru:-29.5,27.5;Europe/Vilnius:54.7,25.3;Europe/Luxembourg:49.6,6.2;Europe/Riga:57.0,24.1;Africa/Tripoli:32.9,13.2;Africa/Casablanca:33.6,-7.6;Europe/Monaco:43.7,7.4;Europe/Chisinau:47.0,28.8;Europe/Podgorica:42.4,19.3;America/Marigot:18.1,-63.1;Indian/Antananarivo:-18.9,47.5;Pacific/Majuro:7.2,171.2;Pacific/Kwajalein:9.1,167.3;Europe/Skopje:42.0,21.4;Africa/Bamako:12.7,-8.0;Asia/Yangon:16.8,96.2;Asia/Ulaanbaatar:47.9,106.9;Asia/Hovd:48.0,91.7;Asia/Macau:22.2,113.5;Pacific/Saipan:15.2,145.8;America/Martinique:14.6,-61.1;Africa/Nouakchott:18.1,-15.9;America/Montserrat:16.7,-62.2;Europe/Malta:35.9,14.5;Indian/Mauritius:-20.2,57.5;Indian/Maldives:4.2,73.5;Africa/Blantyre:-15.8,35.0;America/Mexico_City:19.4,-99.2;America/Cancun:21.1,-86.8;America/Merida:21.0,-89.6;America/Monterrey:25.7,-100.3;America/Matamoros:25.8,-97.5;America/Chihuahua:28.6,-106.1;America/Ciudad_Juarez:31.7,-106.5;America/Ojinaga:29.6,-104.4;America/Mazatlan:23.2,-106.4;America/Bahia_Banderas:20.8,-105.2;America/Hermosillo:29.1,-111.0;America/Tijuana:32.5,-117.0;Asia/Kuala_Lumpur:3.2,101.7;Asia/Kuching:1.6,110.3;Africa/Maputo:-26.0,32.6;Africa/Windhoek:-22.6,17.1;Pacific/Noumea:-22.3,166.4;Africa/Niamey:13.5,2.1;Pacific/Norfolk:-29.1,168.0;Africa/Lagos:6.5,3.4;America/Managua:12.2,-86.3;Europe/Amsterdam:52.4,4.9;Europe/Oslo:59.9,10.8;Asia/Kathmandu:27.7,85.3;Pacific/Nauru:-0.5,166.9;Pacific/Niue:-19.0,-169.9;Pacific/Auckland:-36.9,174.8;Pacific/Chatham:-44.0,-176.6;Asia/Muscat:23.6,58.6;America/Panama:9.0,-79.5;America/Lima:-12.1,-77.0;Pacific/Tahiti:-17.5,-149.6;Pacific/Marquesas:-9.0,-139.5;Pacific/Gambier:-23.1,-134.9;Pacific/Port_Moresby:-9.5,147.2;Pacific/Bougainville:-6.2,155.6;Asia/Manila:14.6,121.0;Asia/Karachi:24.9,67.0;Europe/Warsaw:52.2,21.0;America/Miquelon:47.0,-56.3;Pacific/Pitcairn:-25.1,-130.1;America/Puerto_Rico:18.5,-66.1;Asia/Gaza:31.5,34.5;Asia/Hebron:31.5,35.1;Europe/Lisbon:38.7,-9.1;Atlantic/Madeira:32.6,-16.9;Atlantic/Azores:37.7,-25.7;Pacific/Palau:7.3,134.5;America/Asuncion:-25.3,-57.7;Asia/Qatar:25.3,51.5;Indian/Reunion:-20.9,55.5;Europe/Bucharest:44.4,26.1;Europe/Belgrade:44.8,20.5;Europe/Kaliningrad:54.7,20.5;Europe/Moscow:55.8,37.6;Europe/Simferopol:45.0,34.1;Europe/Kirov:58.6,49.6;Europe/Volgograd:48.7,44.4;Europe/Astrakhan:46.4,48.0;Europe/Saratov:51.6,46.0;Europe/Ulyanovsk:54.3,48.4;Europe/Samara:53.2,50.1;Asia/Yekaterinburg:56.9,60.6;Asia/Omsk:55.0,73.4;Asia/Novosibirsk:55.0,82.9;Asia/Barnaul:53.4,83.8;Asia/Tomsk:56.5,85.0;Asia/Novokuznetsk:53.8,87.1;Asia/Krasnoyarsk:56.0,92.8;Asia/Irkutsk:52.3,104.3;Asia/Chita:52.0,113.5;Asia/Yakutsk:62.0,129.7;Asia/Khandyga:62.7,135.6;Asia/Vladivostok:43.2,131.9;Asia/Ust-Nera:64.6,143.2;Asia/Magadan:59.6,150.8;Asia/Sakhalin:47.0,142.7;Asia/Srednekolymsk:67.5,153.7;Asia/Kamchatka:53.0,158.7;Asia/Anadyr:64.8,177.5;Africa/Kigali:-1.9,30.1;Asia/Riyadh:24.6,46.7;Pacific/Guadalcanal:-9.5,160.2;Indian/Mahe:-4.7,55.5;Africa/Khartoum:15.6,32.5;Europe/Stockholm:59.3,18.1;Asia/Singapore:1.3,103.8;Atlantic/St_Helena:-15.9,-5.7;Europe/Ljubljana:46.0,14.5;Arctic/Longyearbyen:78.0,16.0;Europe/Bratislava:48.1,17.1;Africa/Freetown:8.5,-13.2;Europe/San_Marino:43.9,12.5;Africa/Dakar:14.7,-17.4;Africa/Mogadishu:2.1,45.4;America/Paramaribo:5.8,-55.2;Africa/Juba:4.8,31.6;Africa/Sao_Tome:0.3,6.7;America/El_Salvador:13.7,-89.2;America/Lower_Princes:18.1,-63.0;Asia/Damascus:33.5,36.3;Africa/Mbabane:-26.3,31.1;America/Grand_Turk:21.5,-71.1;Africa/Ndjamena:12.1,15.1;Indian/Kerguelen:-49.4,70.2;Africa/Lome:6.1,1.2;Asia/Bangkok:13.8,100.5;Asia/Dushanbe:38.6,68.8;Pacific/Fakaofo:-9.4,-171.2;Asia/Dili:-8.6,125.6;Asia/Ashgabat:38.0,58.4;Africa/Tunis:36.8,10.2;Pacific/Tongatapu:-21.1,-175.2;Europe/Istanbul:41.0,29.0;America/Port_of_Spain:10.7,-61.5;Pacific/Funafuti:-8.5,179.2;Asia/Taipei:25.1,121.5;Africa/Dar_es_Salaam:-6.8,39.3;Europe/Kyiv:50.4,30.5;Africa/Kampala:0.3,32.4;Pacific/Midway:28.2,-177.4;Pacific/Wake:19.3,166.6;America/New_York:40.7,-74.0;America/Detroit:42.3,-83.0;America/Kentucky/Louisville:38.3,-85.8;America/Kentucky/Monticello:36.8,-84.8;America/Indiana/Indianapolis:39.8,-86.2;America/Indiana/Vincennes:38.7,-87.5;America/Indiana/Winamac:41.1,-86.6;America/Indiana/Marengo:38.4,-86.3;America/Indiana/Petersburg:38.5,-87.3;America/Indiana/Vevay:38.7,-85.1;America/Chicago:41.9,-87.7;America/Indiana/Tell_City:38.0,-86.8;America/Indiana/Knox:41.3,-86.6;America/Menominee:45.1,-87.6;America/North_Dakota/Center:47.1,-101.3;America/North_Dakota/New_Salem:46.8,-101.4;America/North_Dakota/Beulah:47.3,-101.8;America/Denver:39.7,-105.0;America/Boise:43.6,-116.2;America/Phoenix:33.4,-112.1;America/Los_Angeles:34.1,-118.2;America/Anchorage:61.2,-149.9;America/Juneau:58.3,-134.4;America/Sitka:57.2,-135.3;America/Metlakatla:55.1,-131.6;America/Yakutat:59.5,-139.7;America/Nome:64.5,-165.4;America/Adak:51.9,-176.7;Pacific/Honolulu:21.3,-157.9;America/Montevideo:-34.9,-56.2;Asia/Samarkand:39.7,66.8;Asia/Tashkent:41.3,69.3;Europe/Vatican:41.9,12.5;America/St_Vincent:13.2,-61.2;America/Caracas:10.5,-66.9;America/Tortola:18.4,-64.6;America/St_Thomas:18.4,-64.9;Asia/Ho_Chi_Minh:10.8,106.7;Pacific/Efate:-17.7,168.4;Pacific/Wallis:-13.3,-176.2;Pacific/Apia:-13.8,-171.7;Asia/Aden:12.8,45.2;Indian/Mayotte:-12.8,45.2;Africa/Johannesburg:-26.2,28.0;Africa/Lusaka:-15.4,28.3;Africa/Harare:-17.8,31.1";
  let zoneMap;
  function location(date) {
    let zone = "";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {}
    if (!zoneMap) {
      zoneMap = new Map(ZONES.split(";").map((entry) => {
        const [name, coords] = entry.split(":");
        return [name, coords.split(",").map(Number)];
      }));
    }
    // Unknown zone: guess the longitude from the UTC offset, mid latitude.
    return zoneMap.get(zone) || [40, -date.getTimezoneOffset() / 4];
  }

  // Today's sunrise, solar noon and sunset as local hours (NOAA's
  // approximation, good to a few minutes). Day length is held between 4 and
  // 20 hours so polar days and nights still get every color.
  function sunTimes(date) {
    const [lat, lon] = location(date);
    const rad = Math.PI / 180;
    const day = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 864e5;
    const g = ((2 * Math.PI) / 365) * (day - 0.5);
    const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
      - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const cosH = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl))
      - Math.tan(lat * rad) * Math.tan(decl);
    const halfDay = (Math.acos(Math.min(0.866, Math.max(-0.866, cosH))) / rad) * 4 / 60;
    const noon = (720 - 4 * lon - eqTime - date.getTimezoneOffset()) / 60;
    return { sunrise: noon - halfDay, noon, sunset: noon + halfDay };
  }
  // Hue of the green baked into Spotify's equalizer image.
  const EQUALIZER_HUE = 141;

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
  }

  const toHex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

  function luminance(rgb) {
    const [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // White or black, whichever reads better on the fill.
  function onColor(rgb) {
    const lum = luminance(rgb);
    return 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05 ? "#ffffff" : "#000000";
  }

  // ---- the sky's colors: [hour, sky top, sky bottom, cloud lit side, cloud
  // shade side] through the day.
  function skyFrames({ sunrise: r, sunset: s }) {
    const night = ["#04040d", "#0f0c24", "#4a5272", "#15172a"];
    return monotonic([
      [0, ...night], [r - 0.75, ...night],
      [r - 0.25, "#17153a", "#5e3558", "#c98a9a", "#3a2a48"], // dawn
      [r + 0.2, "#21386a", "#c26b4c", "#ffc49a", "#6b5a78"], // sunrise
      [r + 1.5, "#1b4d8c", "#4f8bc0", "#fbfcff", "#9eabc2"], // morning
      [s - 2, "#1f5797", "#5f98c8", "#ffffff", "#a4b1c6"], // midday
      [s - 0.8, "#2a4a7c", "#c58c4a", "#ffe0b5", "#8c7f8e"], // golden hour
      [s, "#2c2452", "#d0582f", "#ffad7d", "#5c3f5c"], // sunset
      [s + 0.5, "#19153a", "#6a2f56", "#a5677f", "#2a1f3a"], // dusk
      [s + 1.1, ...night], [24, ...night],
    ].map(([h, ...c]) => [h, ...c.map(hex)]));
  }

  // How each weather greys the sky, hides the sun and stars, and wets the
  // glass.
  const SCENES = {
    clear: { grey: 0, sun: 1, stars: 1, wet: 0 },
    partly: { grey: 0.1, sun: 1, stars: 0.85, wet: 0 },
    cloudy: { grey: 0.7, sun: 0.25, stars: 0.05, wet: 0 },
    drizzle: { grey: 0.75, sun: 0.15, stars: 0, wet: 0.55 },
    rain: { grey: 0.82, sun: 0.1, stars: 0, wet: 0.85 },
    storm: { grey: 0.92, sun: 0, stars: 0, wet: 1 },
    snow: { grey: 0.72, sun: 0.2, stars: 0, wet: 0 },
    fog: { grey: 0.78, sun: 0.35, stars: 0, wet: 0 },
  };

  // Everything about the sky at this hour in this weather.
  function skyAt(hour, sun, scene) {
    const look = SCENES[scene] || SCENES.partly, { sunrise: r, sunset: s } = sun;
    const f = skyFrames(sun);
    let i = 1;
    while (i < f.length - 1 && hour > f[i][0]) i++;
    const k = clamp((hour - f[i - 1][0]) / (f[i][0] - f[i - 1][0] || 1));
    let [top, bottom, lit, shade] = f[i].slice(1).map((c, j) => mix(f[i - 1][j + 1], c, k));
    // Overcast: sky and clouds go grey, keeping a hint of the hour's light.
    const dayness = clamp(((hour - r) / (s - r)) * 6) * clamp(((s - hour) / (s - r)) * 6);
    const storm = scene === "storm";
    top = mix(top, mix(mix([20, 22, 30], [58, 64, 78], dayness), top, 0.2), look.grey);
    bottom = mix(bottom, mix(mix([30, 32, 42], [92, 100, 116], dayness), bottom, 0.2), look.grey);
    lit = mix(lit, mix(mix([60, 64, 80], storm ? [150, 156, 170] : [196, 202, 214], dayness), lit, 0.25), look.grey);
    shade = mix(shade, mix(mix([16, 18, 26], storm ? [44, 48, 60] : [74, 82, 98], dayness), shade, 0.25), look.grey);

    // The sun crosses right to left; the moon follows the same path at night.
    const t = (hour - r) / (s - r), edge = Math.min(t, 1 - t);
    const sunO = clamp((edge + 0.03) * 14) * look.sun;
    const nightLen = 24 - s + r, nt = ((((hour - s) % 24) + 24) % 24) / nightLen, nEdge = Math.min(nt, 1 - nt);
    const moonO = nt <= 1 ? clamp((nEdge - 0.04) * 12) * Math.max(look.sun, 0.15) : 0;
    const daylight = clamp((edge + 0.05) * 8);
    return {
      scene, look, top, bottom, lit, shade, sunO, moonO, daylight,
      isDay: t >= 0 && t <= 1,
      sunX: 92 - clamp(t) * 84,
      sunY: 92 - Math.sin(Math.PI * clamp(t)) * 66,
      moonX: 92 - clamp(nt) * 84,
      moonY: 86 - Math.sin(Math.PI * clamp(nt)) * 56,
      sunRgb: mix([255, 150, 70], [255, 236, 190], clamp(edge * 6)),
      stars: clamp(1 - daylight * 1.6) * look.stars,
    };
  }

  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min, sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, sat, l];
  }

  // The accent is the sky's own color, a little richer: blue on a clear
  // day, steel grey in rain, orange at sunset, indigo at night. Surfaces are
  // near-black tints of it.
  function paletteAt(sky) {
    const [h, s0] = rgbToHsl(sky.bottom);
    const sat = clamp(s0 * 1.15, 0.18, 0.7) * 100;
    const light = 62;
    const surfaceSat = Math.min(50, sat);
    const textSat = Math.min(sat + 20, 90);
    const rgb = {
      fill: hslToRgb(h, sat, light),
      fillDim: hslToRgb(h, sat, light - 7),
      hover: hslToRgb(h, sat, light + 6),
      press: hslToRgb(h, sat, light - 12),
      text: hslToRgb(h, textSat, 75),
      textHover: hslToRgb(h, textSat, 84),
      surface: hslToRgb(h, surfaceSat, 8),
      surfaceHover: hslToRgb(h, surfaceSat, 13),
      surfacePress: hslToRgb(h, surfaceSat, 6),
      card: hslToRgb(h, surfaceSat, 10),
      tab: hslToRgb(h, surfaceSat, 16),
      glow: hslToRgb(h, surfaceSat, 20),
      tint: hslToRgb(h, Math.min(84, sat + 20), 64),
    };
    return { hue: h, rgb, onFill: onColor(rgb.fill) };
  }

  function apply(sky) {
    const { hue, rgb, onFill } = paletteAt(sky);
    // What the panels' glass picks up: the sun's glint by day, the moon's
    // (cooler, fainter) at night, and how wet it is.
    const grey = sky.look.grey;
    const sunGlint = sky.sunO * (1 - grey * 0.85), moonGlint = sky.moonO * 0.45 * (1 - grey);
    const vars = {
      "--pb-sky-top": trip(sky.top),
      "--pb-sky-bottom": trip(sky.bottom),
      "--pb-sky-lit": trip(sky.lit),
      "--pb-glint-rgb": trip(sunGlint >= moonGlint ? mix(sky.sunRgb, [255, 255, 255], 0.3) : [190, 205, 255]),
      "--pb-glint-a": Math.max(sunGlint, moonGlint).toFixed(2),
      "--pb-glint-x": `${(sky.isDay ? sky.sunX : sky.moonX).toFixed(1)}%`,
      "--pb-mote-a": (sky.sunO * (1 - grey) * sky.daylight).toFixed(2),
      "--pb-wet": sky.look.wet,
      "--spice-button-active": toHex(rgb.fill),
      "--spice-rgb-button-active": rgb.fill.join(","),
      "--spice-button": toHex(rgb.fillDim),
      "--spice-rgb-button": rgb.fillDim.join(","),
      "--spice-main-elevated": toHex(rgb.surface),
      "--spice-rgb-main-elevated": rgb.surface.join(","),
      "--spice-highlight": toHex(rgb.surface),
      "--spice-rgb-highlight": rgb.surface.join(","),
      "--spice-highlight-elevated": toHex(rgb.surfaceHover),
      "--spice-rgb-highlight-elevated": rgb.surfaceHover.join(","),
      "--spice-card": toHex(rgb.card),
      "--spice-rgb-card": rgb.card.join(","),
      "--spice-tab-active": toHex(rgb.tab),
      "--spice-rgb-tab-active": rgb.tab.join(","),
      "--pb-hover": toHex(rgb.hover),
      "--pb-press": toHex(rgb.press),
      "--pb-on-fill": onFill,
      "--pb-text": toHex(rgb.text),
      "--pb-text-hover": toHex(rgb.textHover),
      "--pb-surface-hover": toHex(rgb.surfaceHover),
      "--pb-surface-press": toHex(rgb.surfacePress),
      "--pb-tint-rgb": rgb.tint.join(","),
      "--pb-glow": toHex(rgb.glow),
      "--pb-eq-filter": `hue-rotate(${Math.round(hue - EQUALIZER_HUE)}deg) saturate(1.2) brightness(0.95)`,
    };
    const style = document.documentElement.style;
    for (const [name, value] of Object.entries(vars)) style.setProperty(name, value);
  }

  // ------------------------------------------------------------------- sky
  // The top bar's glass shows a live sky: clouds at two depths, the sun by
  // day and tonight's real moon phase by night, with rain, snow, fog and
  // lightning from the current weather here (Open-Meteo, every 30 minutes).
  //
  // Kept light: clouds are generated from noise once per weather change, at
  // half resolution, and after that only slide (GPU transforms, no redraw).
  // Recoloring through the day repaints from the stored cloud shapes.
  // Nothing runs per frame, and everything pauses while Spotify is hidden.
  //
  // From Spotify's devtools: PureBlackSky.setWeather("storm") or
  // PureBlackSky.setHour(21.5) to preview; call either with nothing to go
  // back to the live weather and time.
  function startSky(onChange) {
    const TOP_BAR = ".EmXZMILXH0bP7U461Va6";
    const WEATHER_EVERY = 30 * 60 * 1000;
    const WEATHER_RETRY = 10 * 60 * 1000;
    const CACHE_KEY = "pureblack:sky-weather";
    const SCENE_NAMES = Object.keys(SCENES);
    const css = (c) => `rgb(${c.map(Math.round).join(",")})`;
    const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;

    // Value noise that wraps every `period` cells in x, so tiles loop.
    function hash(x, y, s) {
      let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function vnoise(x, y, period, s) {
      const xi = Math.floor(x), yi = Math.floor(y);
      let fx = x - xi, fy = y - yi;
      fx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
      fy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      const x0 = ((xi % period) + period) % period, x1 = (x0 + 1) % period;
      const a = hash(x0, yi, s), b = hash(x1, yi, s), c = hash(x0, yi + 1, s), d = hash(x1, yi + 1, s);
      return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
    }
    function fbm(x, y, period, octaves, s) {
      let sum = 0, amp = 0.5, norm = 0, f = 1;
      for (let i = 0; i < octaves; i++) {
        sum += amp * vnoise(x * f, y * f, period * f, s + i * 17);
        norm += amp;
        amp *= 0.5;
        f *= 2;
      }
      return sum / norm;
    }

    const root = document.createElement("div");
    root.className = "pb-sky";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <canvas class="pbs-stars"></canvas>
      <canvas class="pbs-stars pbs-twinkle"></canvas>
      <div class="pbs-moon"><canvas width="40" height="40"></canvas></div>
      <div class="pbs-sun"></div>
      <div class="pbs-deck"><div class="pbs-drift"><canvas></canvas><canvas class="pbs-flash pbs-flash-far"></canvas></div></div>
      <div class="pbs-storm pbs-skyflash pbs-flash-far" style="--pbs-bolt-x: 70%"></div>
      <div class="pbs-deck"><div class="pbs-drift"><canvas></canvas><canvas class="pbs-flash pbs-flash-near"></canvas></div></div>
      <div class="pbs-storm pbs-skyflash pbs-flash-near"></div>
      <canvas class="pbs-storm pbs-bolt pbs-flash-near" width="200" height="128"></canvas>
      <div class="pbs-glare"></div>
      <div class="pbs-haze"></div>
      <div class="pbs-precip pbs-rain"></div>
      <div class="pbs-precip pbs-snow"></div>
      <div class="pbs-scrim"></div>`;
    const $ = (s) => root.querySelector(s);
    const [starCanvas, twinkleCanvas] = root.querySelectorAll(".pbs-stars");
    const moonCanvas = $(".pbs-moon canvas");
    const deckEls = [...root.querySelectorAll(".pbs-deck")];
    const boltCanvas = $(".pbs-bolt");
    const nearSkyflash = root.querySelectorAll(".pbs-skyflash")[1];
    const rainEl = $(".pbs-rain");
    const snowEl = $(".pbs-snow");

    // ---- clouds: a deck is one tile of cloud shape (density, and how lit
    // each point is), stored once; painting colors from it is a cheap blend.
    const SCALE = 0.5; // canvas pixels per CSS pixel: clouds are soft
    const TILE = 1024; // CSS px before the pattern repeats

    function makeDeck({ cells, cover, soft, height, seed, stretch = 2.2, warp = 0.9 }) {
      const w = TILE * SCALE, h = Math.round(height * SCALE);
      const dens = new Float32Array(w * h), light = new Float32Array(w * h);
      const k = cells / w;
      const sample = (px, py) => {
        const x = px * k, y = py * k * stretch;
        const wx = fbm(x + 3.1, y + 7.7, cells, 3, seed + 400) - 0.5;
        const wy = fbm(x + 9.4, y + 1.6, cells, 3, seed + 800) - 0.5;
        return fbm(x + wx * warp, y + wy * warp, cells, 6, seed);
      };
      for (let py = 0; py < h; py++) {
        // Thinner toward the top and bottom of the deck.
        const band = smooth(0, 0.3, py / h) * smooth(1, 0.65, py / h);
        for (let px = 0; px < w; px++) {
          const n = sample(px, py);
          const d = smooth(cover, cover + soft, n * (0.75 + 0.25 * band));
          const i = py * w + px;
          dens[i] = d;
          // Lit where the cloud thins toward the light above it.
          if (d > 0.002) light[i] = clamp(0.55 + (n - sample(px, py - 5)) * 7 + (1 - py / h) * 0.25 - d * 0.25);
        }
      }
      return { w, h, dens, light };
    }

    function sizeDeck(el, deck, top, width) {
      const tiles = Math.ceil(width / TILE) + 1;
      el.style.top = `${top}px`;
      const drift = el.firstElementChild;
      drift.style.setProperty("--pbs-tile", TILE);
      for (const c of drift.children) {
        c.width = deck.w * tiles;
        c.height = deck.h;
        c.style.width = `${TILE * tiles}px`;
        c.style.height = `${deck.h / SCALE}px`;
      }
    }

    function paintDeck(el, deck, lit, shade, alpha, storm) {
      const [main, flash] = el.firstElementChild.children;
      const W = main.width, { w, h, dens, light } = deck;
      const ctx = main.getContext("2d");
      const img = ctx.createImageData(W, h), px = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * w + (x % w), o = (y * W + x) * 4, d = dens[i];
          if (d < 0.002) continue;
          const l = light[i];
          px[o] = shade[0] + (lit[0] - shade[0]) * l;
          px[o + 1] = shade[1] + (lit[1] - shade[1]) * l;
          px[o + 2] = shade[2] + (lit[2] - shade[2]) * l;
          px[o + 3] = 255 * alpha * Math.pow(d, 0.85);
        }
      }
      ctx.putImageData(img, 0, 0);
      // Lightning: the same cloud lit from inside.
      const fctx = flash.getContext("2d");
      if (!storm) {
        fctx.clearRect(0, 0, flash.width, flash.height);
        return;
      }
      const fimg = fctx.createImageData(W, h), fp = fimg.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * w + (x % w), o = (y * W + x) * 4;
          fp[o] = 225;
          fp[o + 1] = 230;
          fp[o + 2] = 255;
          fp[o + 3] = 255 * dens[i] * (0.35 + 0.65 * light[i]) * 0.8;
        }
      }
      fctx.putImageData(fimg, 0, 0);
    }

    // [far deck, near deck] per scene. cover is the noise threshold (lower
    // means more cloud); dur is seconds per 1024px of drift.
    const DECKS = {
      clear: [{ cells: 4, cover: 0.62, soft: 0.16, alpha: 0.5, dur: 300 }, null],
      partly: [{ cells: 4, cover: 0.53, soft: 0.2, alpha: 0.75, dur: 260 }, { cells: 3, cover: 0.57, soft: 0.17, alpha: 0.95, dur: 150 }],
      cloudy: [{ cells: 5, cover: 0.36, soft: 0.28, alpha: 0.95, dur: 240 }, { cells: 3, cover: 0.45, soft: 0.22, alpha: 0.95, dur: 140 }],
      drizzle: [{ cells: 5, cover: 0.32, soft: 0.3, alpha: 1, dur: 220 }, { cells: 3, cover: 0.44, soft: 0.24, alpha: 0.95, dur: 130 }],
      rain: [{ cells: 5, cover: 0.28, soft: 0.3, alpha: 1, dur: 200 }, { cells: 3, cover: 0.4, soft: 0.24, alpha: 1, dur: 110 }],
      storm: [{ cells: 5, cover: 0.22, soft: 0.3, alpha: 1, dur: 150 }, { cells: 3, cover: 0.34, soft: 0.22, alpha: 1, dur: 75 }],
      snow: [{ cells: 5, cover: 0.3, soft: 0.32, alpha: 0.95, dur: 260 }, { cells: 3, cover: 0.46, soft: 0.26, alpha: 0.85, dur: 170 }],
      fog: [{ cells: 2, cover: 0.18, soft: 0.6, alpha: 0.75, dur: 320, stretch: 4 }, { cells: 3, cover: 0.38, soft: 0.45, alpha: 0.6, dur: 200, stretch: 3.5 }],
    };
    let decks = [null, null];

    function buildDecks(width, height) {
      // Taller than the bar so the clouds run off its top and bottom.
      const layout = [{ height: height + 12, top: -10 }, { height: height + 40, top: -22 }];
      decks = DECKS[scene].map((spec, i) => {
        const el = deckEls[i];
        if (!spec) {
          el.style.display = "none";
          return null;
        }
        el.style.display = "";
        const deck = makeDeck({ ...spec, height: layout[i].height, seed: 101 + i * 1000 + SCENE_NAMES.indexOf(scene) * 7 });
        deck.spec = spec;
        sizeDeck(el, deck, layout[i].top, width);
        el.firstElementChild.style.animationDuration = `${spec.dur}s`;
        return deck;
      });
    }

    // ---- rain and snow: each layer is a tile of streaks or flakes drawn
    // twice vertically, falling one tile per loop.
    function precipLayer(parent, width, { tileH, count, draw, speed, sway, scale = 1 }) {
      const W = Math.ceil(width * 1.35), r = rng(count * 31 + tileH);
      const c = document.createElement("canvas");
      c.width = Math.round(W * scale);
      c.height = Math.round(tileH * 2 * scale);
      c.style.width = `${W}px`;
      c.style.height = `${tileH * 2}px`;
      const ctx = c.getContext("2d");
      ctx.scale(scale, scale);
      const n = Math.round((count * W) / 1000);
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * tileH;
        for (const dy of [0, tileH]) draw(ctx, x, y + dy, r);
      }
      const fall = document.createElement("div");
      fall.className = "pbs-fall";
      fall.style.setProperty("--pbs-tileh", tileH);
      fall.style.animationDuration = `${tileH / speed}s`;
      fall.appendChild(c);
      if (sway) {
        const s = document.createElement("div");
        s.className = "pbs-sway";
        s.style.animationDuration = `${sway}s`;
        s.appendChild(fall);
        parent.appendChild(s);
      } else parent.appendChild(fall);
    }

    const streak = (len, width, alpha) => (ctx, x, y, r) => {
      const L = len[0] + r() * (len[1] - len[0]), a = alpha[0] + r() * (alpha[1] - alpha[0]);
      const g = ctx.createLinearGradient(x, y, x, y + L);
      g.addColorStop(0, "rgba(210,222,240,0)");
      g.addColorStop(0.75, `rgba(215,226,245,${a})`);
      g.addColorStop(1, `rgba(235,242,255,${Math.min(1, a * 1.1)})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + L);
      ctx.stroke();
    };
    const flake = (size, alpha) => (ctx, x, y, r) => {
      const s = size[0] + r() * (size[1] - size[0]), a = alpha[0] + r() * (alpha[1] - alpha[0]);
      const g = ctx.createRadialGradient(x, y, 0, x, y, s);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.45, `rgba(250,252,255,${a * 0.75})`);
      g.addColorStop(1, "rgba(250,252,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    };

    function buildPrecip(width) {
      rainEl.replaceChildren();
      snowEl.replaceChildren();
      const heavy = { drizzle: 0.35, rain: 1, storm: 1.7 }[scene];
      if (heavy) {
        root.dataset.precip = "rain";
        rainEl.style.setProperty("--pbs-wind", `${scene === "storm" ? 16 : scene === "drizzle" ? 6 : 10}deg`);
        const fast = scene === "storm" ? 1.25 : scene === "drizzle" ? 0.7 : 1;
        precipLayer(rainEl, width, { tileH: 160, count: 260 * heavy, speed: 520 * fast, scale: 0.75, draw: streak([7, 13], 0.8, [0.16, 0.3]) });
        precipLayer(rainEl, width, { tileH: 200, count: 120 * heavy, speed: 820 * fast, draw: streak([14, 26], 1, [0.26, 0.45]) });
        precipLayer(rainEl, width, { tileH: 260, count: 34 * heavy, speed: 1250 * fast, draw: streak([30, 50], 1.4, [0.32, 0.55]) });
      } else if (scene === "snow") {
        root.dataset.precip = "snow";
        precipLayer(snowEl, width, { tileH: 128, count: 260, speed: 14, sway: 5, scale: 0.75, draw: flake([0.6, 1.2], [0.4, 0.7]) });
        precipLayer(snowEl, width, { tileH: 160, count: 110, speed: 24, sway: 4, draw: flake([1.2, 2], [0.6, 0.9]) });
        precipLayer(snowEl, width, { tileH: 220, count: 26, speed: 40, sway: 3.2, draw: flake([2.4, 3.6], [0.55, 0.85]) });
      } else root.dataset.precip = "";
    }

    // ---- lightning: a new branched bolt in a new spot every strike.
    function drawBolt() {
      const ctx = boltCanvas.getContext("2d"), W = boltCanvas.width, H = boltCanvas.height, r = Math.random;
      ctx.clearRect(0, 0, W, H);
      const segs = [];
      (function branch(x, y, angle, len, depth) {
        let px = x, py = y;
        const steps = 10 - depth * 3;
        for (let i = 0; i < steps; i++) {
          const nx = px + Math.sin(angle) * len + (r() - 0.5) * len * 1.4;
          const ny = py + Math.cos(angle) * len;
          segs.push([px, py, nx, ny, depth]);
          if (depth < 2 && r() < 0.22) branch(nx, ny, angle + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5), len * 0.7, depth + 1);
          px = nx;
          py = ny;
          if (py > H) break;
        }
      })(W / 2 + (r() - 0.5) * 30, -4, (r() - 0.5) * 0.3, H / 9, 0);
      for (const [glow, width, color] of [[14, 5, "rgba(170,185,255,0.35)"], [6, 2.4, "rgba(215,225,255,0.85)"], [0, 1.1, "#fff"]]) {
        ctx.shadowBlur = glow;
        ctx.shadowColor = "rgba(170,185,255,0.9)";
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        for (const [x1, y1, x2, y2, d] of segs) {
          ctx.lineWidth = width / (d + 1);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      const x = 8 + Math.random() * 84;
      boltCanvas.style.left = `calc(${x}% - 50px)`;
      nearSkyflash.style.setProperty("--pbs-bolt-x", `${x}%`);
    }
    boltCanvas.addEventListener("animationiteration", drawBolt);

    // ---- stars and moon
    function buildStars(width, height) {
      const r = rng(7), dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const [c, count, bright] of [[starCanvas, 180, [0.25, 0.9]], [twinkleCanvas, 26, [0.7, 1]]]) {
        c.width = width * dpr;
        c.height = height * dpr;
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
        const ctx = c.getContext("2d");
        ctx.scale(dpr, dpr);
        const n = Math.round((count * width) / 1000);
        for (let i = 0; i < n; i++) {
          const x = r() * width, y = r() * height, s = 0.35 + Math.pow(r(), 3) * 0.9, a = bright[0] + r() * (bright[1] - bright[0]);
          const tint = r();
          ctx.fillStyle = `rgba(${tint < 0.15 ? "200,215,255" : tint > 0.92 ? "255,235,210" : "255,255,255"},${a})`;
          ctx.beginPath();
          ctx.arc(x, y, s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Today's real phase (days since a known new moon), shaded as a sphere
    // with faint maria.
    let moonAge = -1;
    function drawMoon() {
      const age = ((((Date.now() / 864e5 - 10962.76) % 29.530589) + 29.530589) % 29.530589);
      if (Math.abs(age - moonAge) < 0.1) return;
      moonAge = age;
      const ctx = moonCanvas.getContext("2d"), S = moonCanvas.width, R = S / 2 - 1;
      const phase = (age / 29.530589) * Math.PI * 2;
      const L = [Math.sin(phase), 0, -Math.cos(phase)];
      const img = ctx.createImageData(S, S), p = img.data;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const nx = (x + 0.5 - S / 2) / R, ny = (y + 0.5 - S / 2) / R, rr = nx * nx + ny * ny;
          if (rr > 1) continue;
          const nz = Math.sqrt(1 - rr);
          const lit = clamp((nx * L[0] + nz * L[2]) * 4 + 0.15);
          const albedo = 0.82 - smooth(0.5, 0.65, fbm(nx * 2 + 5, ny * 2 + 5, 64, 4, 9)) * 0.25;
          const v = (0.07 + lit * albedo * 0.93) * 255, o = (y * S + x) * 4;
          p[o] = v * 0.97;
          p[o + 1] = v * 0.97;
          p[o + 2] = v;
          p[o + 3] = 255 * clamp((1 - Math.sqrt(rr)) * R);
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    // ---- state
    let scene = "partly";
    let liveScene = null;
    let forcedScene = null;
    let built = null; // "scene@WxH" the clouds were made for
    let lastPaint = "";
    let lastSky = null;
    let stormStart = 0;

    function render(sky = lastSky) {
      lastSky = sky;
      if (!sky || !root.isConnected) return;
      const width = root.clientWidth, height = root.clientHeight;
      if (!width || !height) return;
      if (built !== `${scene}@${width}x${height}`) {
        built = `${scene}@${width}x${height}`;
        root.dataset.weather = scene;
        if (scene === "storm") stormStart = performance.now();
        buildStars(width, height);
        buildDecks(width, height);
        buildPrecip(width);
        if (scene === "storm") drawBolt();
        lastPaint = "";
      }
      drawMoon();

      const vars = {
        "--pbs-top": css(sky.top),
        "--pbs-bottom": css(sky.bottom),
        "--pbs-sun-x": `${sky.sunX}%`,
        "--pbs-sun-y": `${sky.sunY}%`,
        "--pbs-sun-o": sky.sunO.toFixed(2),
        "--pbs-sun-rgb": sky.sunRgb.map(Math.round).join(","),
        "--pbs-glare": (sky.sunO * 0.9).toFixed(2),
        "--pbs-moon-x": `${sky.moonX}%`,
        "--pbs-moon-y": `${sky.moonY}%`,
        "--pbs-moon-o": sky.moonO.toFixed(2),
        "--pbs-stars": sky.stars.toFixed(2),
      };
      for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
      // Only twinkle when there are stars to see.
      root.classList.toggle("pbs-night", sky.stars > 0.02);

      // Repaint the clouds only when their colors visibly change.
      const key = [sky.lit, sky.shade].flat().map((x) => Math.round(x / 3)).join(",") + scene;
      if (key !== lastPaint) {
        lastPaint = key;
        decks.forEach((d, i) => d && paintDeck(deckEls[i], d, sky.lit, sky.shade, d.spec.alpha, scene === "storm"));
      }
    }

    // ---- weather on the panels' glass. Each panel (library, main view,
    // right sidebar, playbar) gets one layer over its content: rain beads that
    // gather and dry, drops that run down, snow drifting past with frosted
    // corners, a sun glint and floating dust, drifting fog, and lightning in
    // time with the top bar. Every texture is drawn once into a small tile
    // and after that only moves or fades.
    const PANELS = ["#Desktop_LeftSidebar_Id", ".BPRPH_jrStQIw2m2qfDl", ".dMf_PkfPVTEuSmc11MZp", '[data-testid="now-playing-bar"]'];
    function tile(S, draw) {
      const c = document.createElement("canvas");
      c.width = S;
      c.height = S;
      draw(c.getContext("2d"), S);
      return `url(${c.toDataURL()})`;
    }
    // A bead of water: clear middle, bright rim, dark refracted lower edge
    // and a highlight.
    function bead(ctx, x, y, rad, stretch = 1) {
      let g = ctx.createRadialGradient(x, y + rad * 0.25, rad * 0.1, x, y, rad * stretch);
      g.addColorStop(0, "rgba(220,230,255,0.06)");
      g.addColorStop(0.65, "rgba(220,230,255,0.12)");
      g.addColorStop(1, "rgba(240,246,255,0.5)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rad * 0.92, rad * stretch, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = Math.max(1.2, rad * 0.16);
      ctx.beginPath();
      ctx.ellipse(x, y + 0.6, rad * 0.92, rad * stretch, 0, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      const hx = x - rad * 0.35, hy = y - rad * 0.4 * stretch;
      g = ctx.createRadialGradient(hx, hy, 0, hx, hy, rad * 0.4);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, rad * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    function softDots(ctx, S, r, n, size, alpha, rgb) {
      for (let i = 0; i < n; i++) {
        const x = r() * S, y = r() * S, sz = size[0] + Math.pow(r(), 2) * (size[1] - size[0]), a = alpha[0] + r() * (alpha[1] - alpha[0]);
        for (const [dx, dy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) { // wrapped, so the tile is seamless
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, sz);
          g.addColorStop(0, `rgba(${rgb},${a})`);
          g.addColorStop(0.45, `rgba(${rgb},${a * 0.7})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // Textures are made the first time a weather needs them.
    const MAKE = {
      beads: () => [11, 22].map((seed) => tile(840, (ctx, S) => {
        const r = rng(seed);
        for (let i = 0; i < 70; i++) bead(ctx, 12 + r() * (S - 24), 12 + r() * (S - 24), 2.2 + Math.pow(r(), 2) * 9);
        for (let i = 0; i < 300; i++) {
          ctx.fillStyle = `rgba(230,238,255,${0.05 + r() * 0.12})`;
          ctx.beginPath();
          ctx.arc(r() * S, r() * S, 0.5 + r() * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      })),
      drop: () => {
        const img = tile(96, (ctx, S) => {
          bead(ctx, S / 2, S * 0.55, S * 0.36, 1.2);
          ctx.globalCompositeOperation = "lighter";
          bead(ctx, S / 2, S * 0.55, S * 0.36, 1.2);
        });
        document.documentElement.style.setProperty("--pb-drop-img", img);
        return img;
      },
      frost: () => tile(840, (ctx, S) => {
        const r = rng(77);
        for (let i = 0; i < 2600; i++) {
          ctx.fillStyle = `rgba(235,242,255,${0.12 + r() * 0.4})`;
          ctx.beginPath();
          ctx.arc(r() * S, r() * S, 0.4 + Math.pow(r(), 3) * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(235,242,255,0.28)";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 70; i++) { // little crystal branches
          let x = r() * S, y = r() * S, a = r() * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let k = 0; k < 6; k++) {
            a += (r() - 0.5) * 1.2;
            x += Math.cos(a) * 6;
            y += Math.sin(a) * 6;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }),
      // [far small flakes, near big ones], drawn at 2x.
      flakes: () => [[5, 70, [3, 6], [0.5, 0.85]], [6, 16, [7, 13], [0.5, 0.8]]].map(([seed, n, size, alpha]) =>
        tile(1024, (ctx, S) => softDots(ctx, S, rng(seed), n, size, alpha, "255,255,255"))),
      motes: () => [[8, 40, [2, 4.5], [0.35, 0.7]], [9, 18, [2.4, 5], [0.6, 1]]].map(([seed, n, size, alpha]) =>
        tile(840, (ctx, S) => softDots(ctx, S, rng(seed), n, size, alpha, "255,246,225"))),
      // Soft mist, seamless left to right, heavier toward the bottom.
      mist: () => {
        const W = 256, H = 96, c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const ctx = c.getContext("2d"), img = ctx.createImageData(W, H), px = img.data;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const n = fbm((x / W) * 4, (y / H) * 3, 4, 5, 55), o = (y * W + x) * 4;
            px[o] = 200;
            px[o + 1] = 206;
            px[o + 2] = 220;
            px[o + 3] = 255 * smooth(0.32, 0.75, n) * 0.32 * (0.3 + 0.7 * y / H);
          }
        }
        ctx.putImageData(img, 0, 0);
        return `url(${c.toDataURL()})`;
      },
    };
    const textures = {};
    const texture = (name) => (textures[name] ??= MAKE[name]());

    const glasses = new Map(); // panel selector -> { el, timers, key }
    function fillGlass(g) {
      const W = g.el.clientWidth, H = g.el.clientHeight;
      if (!W || !H || !g.el.isConnected) return;
      const key = `${scene}@${W}x${H}`;
      if (key === g.key) return;
      g.key = key;
      g.timers.forEach(clearTimeout);
      g.timers = [];
      g.el.replaceChildren();
      const left = g.el.getBoundingClientRect().left;
      const add = (cls, style = {}, parent = g.el) => {
        const el = document.createElement("div");
        el.className = cls;
        Object.assign(el.style, style);
        parent.appendChild(el);
        return el;
      };
      if (SCENES[scene].wet) {
        texture("drop");
        texture("beads").forEach((img, i) => add("pbg-beads", { backgroundImage: img, animationDelay: `${-i * 10 - ((left / 97) % 10)}s` }));
        const n = Math.max(1, Math.round(((W * H) / 110000) * { drizzle: 0.7, rain: 1.3, storm: 2.1 }[scene]));
        for (let i = 0; i < n; i++) runDrop(g, add("pbg-lane"), W, H);
      } else if (scene === "snow") {
        add("pbg-frost", { backgroundImage: texture("frost") });
        texture("flakes").forEach((img, i) => {
          const sway = add("pbg-sway", { animationDuration: `${6 + i * 2.5}s`, animationDelay: `${-left / 50}s` });
          add("pbg-flakes", { backgroundImage: img, animationDuration: `${i ? 26 : 44}s` }, sway);
        });
      } else if (scene === "fog") {
        add("pbg-mist", { backgroundImage: texture("mist"), animationDelay: `${-left / 9}s` });
        add("pbg-condense");
      } else if (scene === "clear" || scene === "partly") {
        // One sweep crosses the whole window: panels further right start later.
        add("pbg-glint", { animationDelay: `${(left / (window.innerWidth || 1)) * 2.6}s` });
        const wrap = add("pbg-motes-wrap");
        texture("motes").forEach((img, i) => add(i ? "pbg-motes pbg-twinkle" : "pbg-motes", { backgroundImage: img }, wrap));
        if (scene === "partly") add("pbg-dapple");
      } else if (scene === "cloudy") add("pbg-dapple pbg-dim");
      // Lightning in step with the top bar's.
      if (scene === "storm") add("pbg-flash", { animationDelay: `${-(((performance.now() - stormStart) / 1000) % 9.7)}s` });
    }

    // A drop that runs down the glass in fits and starts, fades, and starts
    // again somewhere else. Its first run begins part-way through, so the
    // glass looks like it's been raining a while.
    function runDrop(g, lane, W, H) {
      const runner = document.createElement("div");
      runner.innerHTML = "<i></i><b></b>";
      lane.appendChild(runner);
      const place = (midway = false) => {
        const r = Math.random, size = 9 + r() * 8, h = size * 1.3;
        const y = r() * H * 0.5, dist = (H - y - h) * (0.35 + r() * 0.55);
        Object.assign(lane.style, { left: `${r() * (W - size)}px`, top: `${y}px`, width: `${size}px`, height: `${dist + h}px` });
        runner.style.setProperty("--dist", `${dist}px`);
        runner.style.setProperty("--h", `${h}px`);
        runner.className = r() < 0.5 ? "pbg-runner" : "pbg-runner pbg-alt";
        runner.style.animation = "none";
        void runner.offsetWidth;
        runner.style.animation = "";
        const duration = 7 + r() * 8;
        runner.style.animationDuration = `${duration}s`;
        runner.style.animationDelay = midway ? `${-r() * duration * 0.75}s` : "0s";
      };
      runner.addEventListener("animationend", () => g.timers.push(setTimeout(() => place(), 400 + Math.random() * 3500)));
      place(true);
    }

    function mountGlass() {
      for (const selector of PANELS) {
        const host = document.querySelector(selector);
        if (!host) continue;
        let g = glasses.get(selector);
        if (!g) {
          const el = document.createElement("div");
          el.className = "pb-glass";
          el.setAttribute("aria-hidden", "true");
          g = { el, timers: [], key: "", resize: 0 };
          new ResizeObserver(() => {
            clearTimeout(g.resize);
            g.resize = setTimeout(() => fillGlass(g), 250);
          }).observe(el);
          glasses.set(selector, g);
        }
        if (g.el.parentElement !== host) {
          host.appendChild(g.el);
          g.key = "";
        }
      }
    }

    function setScene(next) {
      next = forcedScene || next || "partly";
      if (next === scene && built) return;
      scene = next;
      onChange(); // recolors everything for the new weather, then render()
      glasses.forEach(fillGlass);
    }

    // ---- live weather. Open-Meteo weather codes -> scene.
    function sceneFor(code, cover) {
      if (code >= 95) return "storm";
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
      if (code >= 51 && code <= 57) return "drizzle";
      if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return code === 61 || code === 80 ? "drizzle" : "rain";
      if (code === 45 || code === 48) return "fog";
      if (code === 3 || cover > 75) return "cloudy";
      if (code >= 1 || cover > 20) return "partly";
      return "clear";
    }
    let fetchedAt = 0;
    let weatherTimer = 0;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && SCENE_NAMES.includes(cached.scene) && Date.now() - cached.at < 3 * 3600e3) {
        liveScene = cached.scene;
        fetchedAt = cached.at;
      }
    } catch {}
    async function fetchWeather() {
      clearTimeout(weatherTimer);
      let wait = WEATHER_EVERY;
      try {
        const [lat, lon] = location(new Date());
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,cloud_cover`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const { current } = await res.json();
        liveScene = sceneFor(current.weather_code, current.cloud_cover);
        fetchedAt = Date.now();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ scene: liveScene, at: fetchedAt }));
        } catch {}
        setScene(liveScene);
      } catch {
        wait = WEATHER_RETRY; // keep the last sky and try again later
      }
      weatherTimer = setTimeout(fetchWeather, wait);
    }

    // ---- mounting. Spotify can rebuild the top bar, so check it's still in
    // place every few seconds (one query, nothing else).
    function mount() {
      mountGlass();
      const bar = document.querySelector(TOP_BAR);
      if (!bar) return;
      if (root.parentElement !== bar) {
        bar.prepend(root);
        bar.classList.add("pb-has-sky");
      }
    }
    // Rebuilds for a new size once resizing settles.
    let resizeTimer = 0;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => render(), 250);
    }).observe(root);
    mount();
    setInterval(mount, 3000);

    document.addEventListener("visibilitychange", () => {
      root.classList.toggle("pbs-paused", document.hidden);
      document.documentElement.classList.toggle("pb-hidden", document.hidden);
      if (!document.hidden && Date.now() - fetchedAt > WEATHER_EVERY) fetchWeather();
    });

    setScene(liveScene);
    if (Date.now() - fetchedAt > WEATHER_EVERY) fetchWeather();
    else weatherTimer = setTimeout(fetchWeather, WEATHER_EVERY - (Date.now() - fetchedAt));

    window.PureBlackSky = {
      setWeather(next) {
        forcedScene = SCENE_NAMES.includes(next) ? next : null;
        setScene(liveScene);
        return scene;
      },
      get weather() {
        return { scene, live: liveScene, checked: fetchedAt ? new Date(fetchedAt) : null };
      },
    };
    return {
      render,
      get scene() {
        return scene;
      },
    };
  }

  let sky = null;
  let previewHour = null;

  function update() {
    const now = new Date();
    const hour = previewHour ?? now.getHours() + now.getMinutes() / 60;
    const sun = sunTimes(now);
    const state = skyAt(hour, sun, sky ? sky.scene : "partly");
    apply(state);
    if (sky) sky.render(state);
  }

  if (typeof document === "undefined") {
    // Loaded outside Spotify (e.g. to preview the palette).
    globalThis.PureBlackPalette = { paletteAt, skyAt, toHex, sunTimes };
    return;
  }

  try {
    sky = startSky(() => update());
  } catch (error) {
    console.warn("PureBlack: sky failed to start", error);
  }
  window.PureBlackSky = window.PureBlackSky || {};
  window.PureBlackSky.setHour = (hour) => {
    previewHour = typeof hour === "number" ? hour : null;
    update();
  };
  update();
  setInterval(update, 60 * 1000);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("resize", update);

  // The top bar is 16px taller than Spotify's (see user.css). Spotify tells
  // macOS its title bar is 64px (scaled by the zoom level) and macOS centers
  // the traffic lights in it, so scale every such call to the taller bar.
  const SPOTIFY_TITLEBAR = 64;
  const THEME_TITLEBAR = 80;
  (function syncTitlebar(attempt = 0) {
    let api;
    try {
      api = Object.values(window.Spicetify?.Platform ?? {}).find((a) => typeof a?.setTitlebarHeight === "function");
    } catch {}
    if (!api) {
      if (attempt < 60) setTimeout(() => syncTitlebar(attempt + 1), 500);
      return;
    }
    const original = api.setTitlebarHeight.bind(api);
    api.setTitlebarHeight = (height) => original((height * THEME_TITLEBAR) / SPOTIFY_TITLEBAR);
    // Spotify set its height before this ran; redo it at the current zoom.
    const zoom = Math.round((window.outerWidth / window.innerWidth) * 100) / 100 || 1;
    api.setTitlebarHeight(SPOTIFY_TITLEBAR * zoom);
  })();

  // .pb-playing on <html> while music plays, for the playbar pulse.
  (function trackPlayback() {
    const player = window.Spicetify?.Player;
    if (!player?.addEventListener || !player.origin) {
      setTimeout(trackPlayback, 300);
      return;
    }
    const sync = () => document.documentElement.classList.toggle("pb-playing", player.isPlaying());
    player.addEventListener("onplaypause", sync);
    player.addEventListener("songchange", sync);
    sync();
  })();
})();

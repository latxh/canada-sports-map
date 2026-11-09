/**
 * Official team and league logos, downloaded from the files each Wikipedia
 * article uses (see `page` for the file page and its licence). Generated;
 * the files live in public/logos/.
 */
export interface LogoInfo {
  file: string;
  page: string;
  license: string;
  /** Identity era the logo belongs to; defaults to the latest era. */
  eraIndex?: number;
}

export const LOGOS: Record<string, LogoInfo> = {
  "atletico-ottawa": {"file": "atletico-ottawa.svg", "page": "https://en.wikipedia.org/wiki/File:Atl%C3%A9tico_Ottawa_logo.svg", "license": "Fair use"},
  "bc-lions": {"file": "bc-lions.svg", "page": "https://en.wikipedia.org/wiki/File:BC_Lions_logo.svg", "license": "Fair use"},
  "calgary-flames": {"file": "calgary-flames.svg", "page": "https://en.wikipedia.org/wiki/File:Calgary_Flames_logo.svg", "license": "Fair use"},
  "calgary-stampeders": {"file": "calgary-stampeders.svg", "page": "https://en.wikipedia.org/wiki/File:Calgary_Stampeders_logo.svg", "license": "Fair use"},
  "cavalry-fc": {"file": "cavalry-fc.svg", "page": "https://en.wikipedia.org/wiki/File:Cavalry_FC_logo.svg", "license": "Fair use"},
  "cf-montreal": {"file": "cf-montreal.svg", "page": "https://commons.wikimedia.org/wiki/File:Logo_of_CF_Montreal_2023.svg", "license": "Fair use"},
  "edmonton-elks": {"file": "edmonton-elks.svg", "page": "https://en.wikipedia.org/wiki/File:Edmonton_Elks_logo.svg", "license": "Fair use"},
  "edmonton-oilers": {"file": "edmonton-oilers.svg", "page": "https://en.wikipedia.org/wiki/File:Logo_Edmonton_Oilers.svg", "license": "Fair use"},
  "fc-edmonton": {"file": "fc-edmonton.svg", "page": "https://en.wikipedia.org/wiki/File:FC_Edmonton_logo.svg", "license": "Fair use"},
  "fc-supra-du-quebec": {"file": "fc-supra-du-quebec.svg", "page": "https://en.wikipedia.org/wiki/File:FC_Supra_du_Qu%C3%A9bec_logo.svg", "license": "Fair use"},
  "forge-fc": {"file": "forge-fc.svg", "page": "https://en.wikipedia.org/wiki/File:Forge_FC_logo.svg", "license": "Fair use"},
  "hamilton-tiger-cats": {"file": "hamilton-tiger-cats.svg", "page": "https://en.wikipedia.org/wiki/File:Hamilton_Tiger-Cats_logo.svg", "license": "Fair use"},
  "hamilton-tigers": {"file": "hamilton-tigers.svg", "page": "https://commons.wikimedia.org/wiki/File:Hamilton_Tigers_Logo.svg", "license": "Public domain"},
  "hfx-wanderers-fc": {"file": "hfx-wanderers-fc.svg", "page": "https://en.wikipedia.org/wiki/File:HFX_Wanderers_FC_logo.svg", "license": "Fair use"},
  "inter-toronto-fc": {"file": "inter-toronto-fc.svg", "page": "https://en.wikipedia.org/wiki/File:Inter_Toronto_FC_logo.svg", "license": "Fair use"},
  "league-CFL": {"file": "league-CFL.svg", "page": "https://en.wikipedia.org/wiki/File:CFL_2016_logo.svg", "license": "Fair use"},
  "league-CPL": {"file": "league-CPL.svg", "page": "https://commons.wikimedia.org/wiki/File:Canadian_Premier_League_badge_2026.svg", "license": "Public domain"},
  "league-MLB": {"file": "league-MLB.svg", "page": "https://commons.wikimedia.org/wiki/File:Major_League_Baseball_logo.svg", "license": "Public domain"},
  "league-MLS": {"file": "league-MLS.svg", "page": "https://en.wikipedia.org/wiki/File:Major_League_Soccer_logo.svg", "license": "Fair use"},
  "league-NBA": {"file": "league-NBA.svg", "page": "https://en.wikipedia.org/wiki/File:National_Basketball_Association_logo.svg", "license": "Fair use"},
  "league-NHL": {"file": "league-NHL.svg", "page": "https://en.wikipedia.org/wiki/File:05_NHL_Shield.svg", "license": "Fair use"},
  "montreal-alouettes": {"file": "montreal-alouettes.png", "page": "https://commons.wikimedia.org/wiki/File:Montreal_Alouettes_logo_2019.png", "license": "CC0"},
  "montreal-canadiens": {"file": "montreal-canadiens.svg", "page": "https://commons.wikimedia.org/wiki/File:Montreal_Canadiens.svg", "license": "Public domain"},
  "montreal-expos": {"file": "montreal-expos.svg", "page": "https://en.wikipedia.org/wiki/File:Montreal_Expos_Logo.svg", "license": "Fair use"},
  "montreal-maroons": {"file": "montreal-maroons.svg", "page": "https://commons.wikimedia.org/wiki/File:Montreal_Maroons_Logo.svg", "license": "Public domain"},
  "montreal-wanderers": {"file": "montreal-wanderers.svg", "page": "https://en.wikipedia.org/wiki/File:Montreal_Wanderers_logo.svg", "license": "Fair use"},
  "ottawa-redblacks": {"file": "ottawa-redblacks.svg", "page": "https://en.wikipedia.org/wiki/File:Ottawa_Redblacks_logo.svg", "license": "PD"},
  "ottawa-renegades": {"file": "ottawa-renegades.svg", "page": "https://en.wikipedia.org/wiki/File:Ottawa_Renegades_Logo.svg", "license": "Fair use"},
  "ottawa-rough-riders": {"file": "ottawa-rough-riders.png", "page": "https://commons.wikimedia.org/wiki/File:Ottawa-Rough-Riders-logo-1950s.png", "license": "CC BY-SA 4.0"},
  "ottawa-senators": {"file": "ottawa-senators.svg", "page": "https://en.wikipedia.org/wiki/File:Ottawa_Senators_2020-2021_logo.svg", "license": "Fair use"},
  "ottawa-senators-original": {"file": "ottawa-senators-original.svg", "page": "https://commons.wikimedia.org/wiki/File:Original_ottawa_sens_logo.svg", "license": "Public domain"},
  "pacific-fc": {"file": "pacific-fc.svg", "page": "https://en.wikipedia.org/wiki/File:Pacific_FC_logo.svg", "license": "Fair use"},
  "quebec-bulldogs": {"file": "quebec-bulldogs.png", "page": "https://commons.wikimedia.org/wiki/File:Quebec_Bulldogs,_1911_logo.png", "license": "Public domain"},
  "quebec-nordiques": {"file": "quebec-nordiques.svg", "page": "https://en.wikipedia.org/wiki/File:Quebec_Nordiques_Logo.svg", "license": "Fair use"},
  "saskatchewan-roughriders": {"file": "saskatchewan-roughriders.svg", "page": "https://en.wikipedia.org/wiki/File:Saskatchewan_Roughriders_logo.svg", "license": "Fair use"},
  "toronto-argonauts": {"file": "toronto-argonauts.svg", "page": "https://en.wikipedia.org/wiki/File:Toronto_Argonauts_logo.svg", "license": "Fair use"},
  "toronto-blue-jays": {"file": "toronto-blue-jays.svg", "page": "https://en.wikipedia.org/wiki/File:Toronto_Blue_Jay_Primary_Logo.svg", "license": "Fair use"},
  "toronto-fc": {"file": "toronto-fc.svg", "page": "https://en.wikipedia.org/wiki/File:Toronto_FC_Logo.svg", "license": "Fair use"},
  "toronto-huskies": {"file": "toronto-huskies.png", "page": "https://en.wikipedia.org/wiki/File:Torontohuskies.png", "license": "Fair use"},
  "toronto-maple-leafs": {"file": "toronto-maple-leafs.svg", "page": "https://en.wikipedia.org/wiki/File:Toronto_Maple_Leafs_2016_logo.svg", "license": "Fair use"},
  "toronto-raptors": {"file": "toronto-raptors.svg", "page": "https://en.wikipedia.org/wiki/File:Toronto_Raptors_logo.svg", "license": "Fair use"},
  "valour-fc": {"file": "valour-fc.svg", "page": "https://commons.wikimedia.org/wiki/File:Valour_FC.svg", "license": "Public domain"},
  "vancouver-canucks": {"file": "vancouver-canucks.svg", "page": "https://en.wikipedia.org/wiki/File:Vancouver_Canucks_logo.svg", "license": "Fair use"},
  "vancouver-fc": {"file": "vancouver-fc.svg", "page": "https://en.wikipedia.org/wiki/File:Vancouver_FC_logo.svg", "license": "Fair use"},
  "vancouver-grizzlies": {"file": "vancouver-grizzlies.svg", "page": "https://en.wikipedia.org/wiki/File:Vancouver_Grizzlies_logo.svg", "license": "Fair use"},
  "vancouver-whitecaps-fc": {"file": "vancouver-whitecaps-fc.svg", "page": "https://commons.wikimedia.org/wiki/File:Vancouver_Whitecaps_logo.svg", "license": "Public domain"},
  "winnipeg-blue-bombers": {"file": "winnipeg-blue-bombers.svg", "page": "https://commons.wikimedia.org/wiki/File:Winnipeg_Blue_Bombers_Logo.svg", "license": "Public domain"},
  "winnipeg-jets": {"file": "winnipeg-jets.svg", "page": "https://en.wikipedia.org/wiki/File:Winnipeg_Jets_Logo_2011.svg", "license": "Fair use"},
  "winnipeg-jets-1972": {"file": "winnipeg-jets-1972.svg", "page": "https://en.wikipedia.org/wiki/File:Winnipeg_Jets_Logo.svg", "license": "Fair use", "eraIndex": 0},
};

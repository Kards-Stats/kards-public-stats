interface LoginReward {
    day: number,
    reset: string,
    seconds: number
}

interface Session {
    achievements_url: string,
    britain_level: number,
    britain_xp: number,
    client_id: number,
    client_url: string,
    dailymissions_url: string,
    decks_url: string,
    draft_admissions: number,
    dust: number,
    email: string,
    email_reward_received: boolean,
    email_verified: boolean,
    germany_level: number,
    germany_xp: number,
    gold: number,
    has_been_officer: boolean,
    heartbeat_url: string,
    is_officer: boolean,
    is_online: boolean,
    japan_level: number,
    japan_xp: number,
    jti: string,
    jwt: string,
    last_daily_mission_cancel: null,
    last_daily_mission_renewal: string,
    last_heartbeat: string,
    last_logon_date: string,
    launch_messages: string[],
    library_url: string,
    new_cards: string[],
    new_player_login_reward: LoginReward,
    npc: boolean,
    online_flag: boolean,
    packs_url: string,
    player_id: number,
    player_name: string,
    player_tag: number,
    player_url: string,
    rewards: string[],
    season_end: string,
    season_wins: number,
    server_time: string,
    soviet_level: number,
    soviet_xp: number,
    stars: number,
    tutorials_done: number,
    tutorials_finished: string[],
    usa_level: number,
    usa_xp: number,
    user_id: number,
    user_url: string
}

interface BuildInfo {
    build_timestamp: string,
    commit_hash: string,
    version: string
}

interface HomeUser {
    client_id: number,
    exp: number,
    iat: number,
    identity_id: number,
    iss: string,
    jti: string,
    player_id: number,
    roles: string[],
    tenant: string,
    tier: string,
    user_id: number,
    user_name: string
}

interface Endpoints {
    clients: string,
    draft: string,
    email: string,
    lobbyplayers: string,
    matches: string,
    matches2: string,
    my_client?: string,
    my_draft?: string,
    my_items?: string,
    my_player?: string,
    my_user?: string,
    players: string,
    root: string,
    session: string,
    store: string,
    tourneys: string,
    transactions: string,
    'user-identities': string,
    user_identities: string,
    users: string
}

interface HostInfo {
    container_name: string,
    docker_image: string,
    host_address: string,
    host_name: string,
    instance_id: string
}

interface Home {
    build_info: BuildInfo,
    current_user?: HomeUser,
    endpoints: Endpoints,
    host_info: HostInfo,
    server_time: string,
    service_name: string,
    tenant_name: string,
    tier_name: string
}

interface Config {
    UnitWeightEffect: boolean,
    allow_breakthrough_craft: boolean,
    allow_release_bg: boolean,
    blueprint_board: boolean,
    breakthrough_set: boolean,
    campaign2020: boolean,
    campaign2020_cards: boolean,
    campaign_lock: boolean,
    campaign_test: boolean,
    christmas: boolean,
    christmas_banner: boolean,
    disable_start_turn_check: boolean,
    dlc: boolean,
    email: boolean,
    enable_chat: boolean,
    enable_offer_countdown: boolean,
    expansion_factions: boolean,
    history_turns: boolean,
    idel_disconnect_minutes: number,
    localization: boolean,
    localization_feedback_url: string,
    most_popular_products: string,
    pvp_sendstate: boolean,
    reconnect: boolean,
    review_lost: number,
    review_url_de: string,
    review_url_en: string,
    review_url_fr: string,
    review_url_pl: string,
    review_url_pt: string,
    review_url_ru: string,
    review_url_zh: string,
    review_wins: number,
    stop_cleanup_after_turn: boolean,
    use_visual_queue: boolean,
    versions: string[],
    wc_button: boolean,
    wc_discord_url: string,
    wc_facebook_url: string,
    wc_season_id: 7,
    wc_steam_url: string,
    wc_twitter_url: string,
    websocket_matchactions: boolean,
    websocket_notifications: boolean,
    websocketurl: string,
    xdisable_review_window: boolean,
    xserver_closed: string,
    xserver_closed_header: string,
    new_rank: boolean,
    radar_search: boolean,
    new_start_turn_message: boolean,
    new_encyclopedia: boolean,
    new_battle_intro: boolean,
    import_deck: boolean,
    deck_labels: boolean,
    old_card_look: boolean,
    show_alphine_and_mobilize_in_encyclopedia: boolean,
    stop_ally_elites: boolean,
    new_frontline: boolean,
    new_seasonal_rewards: boolean,
    new_target_arrow: boolean,
    match_refactor: boolean,
    enable_draft_button: boolean,
    hide_friend_button: boolean,
    easter_blitz: boolean,
    double_xp: boolean,
    legions_set: boolean,
    new_spring_faction: boolean,
    allow_legions_craft: boolean,
    polish_board: boolean,
    polish_song: boolean,
    polloptimization: boolean,
    [key: string]: any
}

interface Account {
    username: string,
    password: string
}

interface SteamAccounts {
    accounts: Account[]
}

interface Keyable {
    [key: string]: any
}

interface Language {
    de: string
    en: string
    es: string
    fr: string
    it: string
    pl: string
    pt: string
    ru: string
    zh: string
}

type Faction = 'Poland' | 'USA' | 'Britain' | 'Germany' | 'Soviet' | 'Japan' | 'France' | 'Italy'
type Rarity = 'Standard' | 'Limited' | 'Special' | 'Elite'
type CardType = 'order' | 'infantry' | 'artillery' | 'tank' | 'fighter' | 'bomber' | 'countermeasure'

interface Card {
	id: number
	card_id: string
	game_id: string
	version: number
	set: string
	text: Language
	type: CardType
	image: string
	image_url: Language
	thumb_url: Language
	title: Language
	attack?: number
	rarity: Rarity
	defense?: number
	faction: Faction
	kredits: number
	import_id: string
	attributes: string[]
	operation_cost: number
}

interface KardsCard {
    id: number
    cardId: string
    importId: string
    json: Keyable
    image_de: string
    image_en: string
    image_es: string
    image_fr: string
    image_it: string
    image_pl: string
    image_pt: string
    image_ru: string
    image_zh: string
    thumb_de: string
    thumb_en: string
    thumb_es: string
    thumb_fr: string
    thumb_it: string
    thumb_pl: string
    thumb_pt: string
    thumb_ru: string
    thumb_zh: string
}

interface Cards {
    count: number
    cards: Card[]
}

interface SteamUser {
	username: string,
	password: string,
	type: string,
	steam_id?: string,
	ticket?: string,
	banned: boolean,
	last_steam_login: Date,
	last_kards_login: Date,
}

export {
    Config,
    Home,
    HomeUser,
    Endpoints,
    BuildInfo,
    HostInfo,
    Session,
    LoginReward,
    SteamAccounts,
    Keyable,
    Language,
    Card,
    Cards,
    Faction,
    Rarity,
    CardType,
    KardsCard,
    SteamUser
}

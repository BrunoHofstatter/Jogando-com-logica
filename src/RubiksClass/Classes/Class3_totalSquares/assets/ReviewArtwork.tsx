import { useId } from "react";

/** Barrel pivot (50,70), muzzle (50,19); both parts share a 100×110 artboard. */
export function Cannon({ angle = 0, recoil = 0 }: { angle?: number; recoil?: number }) {
    const id = useId().replace(/:/g, "");
    return <svg viewBox="0 0 100 110" aria-hidden="true">
        <defs>
            <linearGradient id={`${id}-body`} x2="1" y2="1"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#7e22ce" /></linearGradient>
            <linearGradient id={`${id}-barrel`} x2="1"><stop stopColor="#e0f7ff" /><stop offset=".5" stopColor="#7dd3fc" /><stop offset="1" stopColor="#38bdf8" /></linearGradient>
            <linearGradient id={`${id}-metal`} x2="0" y2="1"><stop stopColor="#edfaff" /><stop offset=".45" stopColor="#9bbbd5" /><stop offset="1" stopColor="#446884" /></linearGradient>
            <radialGradient id={`${id}-charge`}><stop stopColor="#fff" /><stop offset=".45" stopColor="#a5f3fc" /><stop offset="1" stopColor="#0891b2" /></radialGradient>
        </defs>
        <ellipse cx="50" cy="101" rx="44" ry="7" fill="#334155" opacity=".2" />
        <path d="M19 77Q12 80 12 95Q50 111 88 95Q88 80 81 77Z" fill={`url(#${id}-body)`} stroke="#58208e" strokeWidth="4" />
        <path d="M24 91Q50 101 76 91" stroke="#e9d5ff" opacity=".6" strokeWidth="4" fill="none" />
        <path d="M21 79L30 71H70L79 79L75 88H25Z" fill={`url(#${id}-metal)`} stroke="#3c567c" strokeWidth="2" />
        <path d="M25 82H75" stroke="#f0e9ff" strokeWidth="2" />
        <g data-cannon-barrel transform={`rotate(${angle} 50 70)`}>
            <g data-cannon-recoil transform={`translate(0 ${recoil})`}>
                <path d="M29 68L33 54H67L71 68Q50 81 29 68Z" fill="#6651a5" stroke="#403363" strokeWidth="3" />
                <path d="M32 70L36 19Q50 12 64 19L68 70Q50 82 32 70Z" fill={`url(#${id}-barrel)`} stroke="#075985" strokeWidth="3" />
                <path d="M41 26L39 62" stroke="#f0f9ff" strokeWidth="5" strokeLinecap="round" opacity=".7" />
                <path d="M34 37Q50 43 66 37L66 43Q50 49 34 43Z" fill={`url(#${id}-metal)`} stroke="#426580" strokeWidth="1.5" />
                <path d="M33 55Q50 61 67 55L68 62Q50 69 32 62Z" fill={`url(#${id}-metal)`} stroke="#426580" strokeWidth="1.5" />
                <path d="M34 64L33 71M40 67L40 74M60 67L60 74M66 64L67 71" stroke="#324d70" strokeWidth="2" />
                <rect x="44" y="46" width="12" height="9" rx="3" fill="#0e7490" stroke="#075985" strokeWidth="1.5" />
                <path d="M47 49H53M47 52H53" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" />
                <path d="M31 20L32 28Q50 37 68 28L69 20Z" fill={`url(#${id}-metal)`} stroke="#075985" strokeWidth="2" />
                <ellipse cx="50" cy="19" rx="19" ry="10" fill={`url(#${id}-metal)`} stroke="#075985" strokeWidth="3" />
                <ellipse cx="50" cy="19" rx="13" ry="6.5" fill="#163e5a" stroke="#e0f2fe" strokeWidth="1.5" />
                <ellipse cx="50" cy="20" rx="8" ry="3.5" fill={`url(#${id}-charge)`} opacity=".9" />
                {[36, 64].map(cx => <circle key={cx} cx={cx} cy="20" r="1.5" fill="#f1f5f9" />)}
            </g>
        </g>
        <circle cx="50" cy="77" r="15" fill="#c084fc" stroke="#58208e" strokeWidth="4" />
        <circle cx="50" cy="77" r="10" fill="#6840a2" stroke="#e9d5ff" strokeWidth="2" />
        <circle cx="50" cy="77" r="6" fill={`url(#${id}-charge)`} />
        {[20, 80].map(cx => <g key={cx}>
            <circle cx={cx} cy="97" r="9" fill="#33465f" stroke="#23354b" strokeWidth="2" />
            <circle cx={cx} cy="97" r="6" fill={`url(#${id}-metal)`} />
            <path d={`M${cx - 4} 97H${cx + 4}M${cx} 93V101`} stroke="#55718f" strokeWidth="1.5" />
            <circle cx={cx} cy="97" r="2.5" fill="#c084fc" stroke="#6b21a8" />
            <circle cx={cx + (cx === 20 ? 9 : -9)} cy="87" r="2" fill="#eee7ff" stroke="#603294" />
        </g>)}
        <path d="M37 96H63" stroke="#572b87" strokeWidth="3" strokeLinecap="round" />
    </svg>;
}

export function AmmoIcon() {
    return <svg viewBox="0 0 70 70" aria-hidden="true">
        <path d="M13 57L9 33L29 20L48 40L44 62Z" fill="#7c3db5" stroke="#51247b" strokeWidth="3" />
        <path d="M9 33L30 43L48 40M30 43L33 60" fill="none" stroke="#c084fc" strokeWidth="3" />
        <path d="M29 39L34 14Q41 1 49 13L52 40Z" fill="#b9f3ff" stroke="#176c94" strokeWidth="3" />
        <path d="M40 15L38 31" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M29 39L52 40L52 47L29 46Z" fill="#ffe38b" stroke="#9f7225" strokeWidth="2" />
    </svg>;
}

export function ClockIcon() {
    return <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34" fill="none" stroke="white" strokeWidth="9" /><path d="M50 27V51L66 61" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function CheckIcon() {
    return <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 51L42 71L79 29" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const HEART = "M50 91C40 79 8 60 8 34C8 8 37 6 50 25C64 6 92 8 92 34C92 60 62 80 50 91Z";
const SHARDS = [
    "M50 25C37 6 8 8 8 34C8 44 13 53 20 61L40 52L35 38L53 33Z",
    "M50 25L53 33L35 38L40 52L58 48L65 63L84 56C89 48 92 41 92 34C92 8 64 6 50 25Z",
    "M20 61L40 52L58 48L65 63L84 56C74 71 57 82 50 91C42 82 28 73 20 61Z",
];

export function FragmentHeart({ points }: { points: number }) {
    return <svg viewBox="0 0 100 100" role="img" aria-label={`${points} de 3 partes de um coração`}>
        <path d={HEART} fill="#d7dce5" stroke="#7d3346" strokeWidth="3" />
        {SHARDS.map((d, index) => <path key={index} d={d} fill={index < points ? ["#fb7185", "#ef4564", "#dc2850"][index] : "#d7dce5"} stroke={index < points ? "#a41642" : "#a5aabb"} strokeWidth="3" strokeLinejoin="round" />)}
        {points > 0 && <path d="M18 32Q19 20 31 20" fill="none" stroke="#ffe4e6" strokeWidth="5" strokeLinecap="round" />}
    </svg>;
}

export function Crosshair() {
    return <svg viewBox="0 0 60 60" aria-hidden="true">
        {["#fff", "#e52d45"].map((color, index) => <g key={color} fill="none" stroke={color} strokeWidth={index === 0 ? 6 : 3}>
            <circle cx="30" cy="30" r="13" /><path d="M30 3V19M30 41V57M3 30H19M41 30H57" />
        </g>)}
        <circle cx="30" cy="30" r="2" fill="#e52d45" />
    </svg>;
}

export function Dust() {
    return <svg viewBox="0 0 100 100" aria-hidden="true">
        <g fill="#8195aa" stroke="#697f96" strokeWidth="1.5">
            <circle cx="24" cy="55" r="20" /><circle cx="40" cy="31" r="21" />
            <circle cx="67" cy="38" r="22" /><circle cx="78" cy="62" r="18" /><circle cx="49" cy="71" r="22" />
        </g>
        <g fill="#eaf0f7"><circle cx="27" cy="48" r="16" /><circle cx="45" cy="36" r="19" /><circle cx="64" cy="50" r="22" /><circle cx="47" cy="61" r="18" /></g>
        <g fill="#fff"><circle cx="39" cy="31" r="9" /><circle cx="57" cy="42" r="11" /></g>
        <g fill="#8298ae"><circle cx="8" cy="27" r="4" /><circle cx="87" cy="23" r="5" /><circle cx="90" cy="84" r="3" /><circle cx="18" cy="87" r="4" /></g>
    </svg>;
}

export function Corridor() {
    const id = useId().replace(/:/g, "");
    return <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
            <linearGradient id={`${id}-floor`} x2="0" y2="1"><stop stopColor="#c7d9e6" /><stop offset=".6" stopColor="#9eb6cc" /><stop offset="1" stopColor="#6c8da9" /></linearGradient>
            <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#f5fbff" stopOpacity=".8" /><stop offset=".5" stopColor="#acc5d9" stopOpacity=".55" /><stop offset="1" stopColor="#607f9c" stopOpacity=".85" /></linearGradient>
        </defs>
        <path d="M5 9Q2 45 34 93H66Q98 45 95 9Z" fill={`url(#${id}-floor)`} />
        <path d="M5 9Q10 55 34 93L25 100Q0 57 0 17ZM95 9Q90 55 66 93L75 100Q100 57 100 17Z" fill={`url(#${id}-glass)`} />
        <path d="M5 9Q2 45 34 93M95 9Q98 45 66 93" fill="none" stroke="#496c8a" strokeWidth=".8" />
        <path d="M6 9Q4 45 35 93M94 9Q96 45 65 93" fill="none" stroke="#f0faff" strokeWidth=".35" />
        <path d="M5 9H95M6 13Q50 14 94 13M7 18Q50 20 93 18M10 25Q50 28 90 25M13 35Q50 40 87 35M19 49Q50 55 81 49M26 67Q50 75 74 67M33 88Q50 97 67 88" fill="none" stroke="#f0f7fc" strokeWidth=".5" strokeOpacity=".75" />
        <path d="M49 9Q39 35 35 93M51 9Q61 35 65 93M50 9V93" fill="none" stroke="#597e9e" strokeWidth=".3" strokeOpacity=".55" />
        <path d="M0 23L10 25M2 37L13 35M9 56L19 49M20 81L26 67M100 23L90 25M98 37L87 35M91 56L81 49M80 81L74 67" fill="none" stroke="#ecf8ff" strokeWidth=".6" strokeOpacity=".75" />
        <path d="M3 18Q5 50 29 93M97 18Q95 50 71 93" fill="none" stroke="#d8eaf7" strokeWidth=".4" strokeOpacity=".6" />
    </svg>;
}

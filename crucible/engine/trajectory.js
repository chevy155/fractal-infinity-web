import { buildStateVector, computeDynamics, leadershipScore, coords3D, projectYear, evidenceConfidence } from "./dynamics.js";

export function buildTrajectory(ayar, lightmatter) {
  const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
  const sa0 = buildStateVector(ayar);
  const sl0 = buildStateVector(lightmatter);
  const da0 = computeDynamics(ayar, sa0);
  const dl0 = computeDynamics(lightmatter, sl0);

  return years.map(year => {
    const sa = projectYear(sa0, da0, year);
    const sl = projectYear(sl0, dl0, year);
    const da = computeDynamics(ayar, sa);
    const dl = computeDynamics(lightmatter, sl);
    const scoreA = leadershipScore(sa, da);
    const scoreL = leadershipScore(sl, dl);
    return {
      year,
      leader: scoreA >= scoreL ? ayar.name : lightmatter.name,
      leaderId: scoreA >= scoreL ? "ayar" : "lightmatter",
      ayar: { score: scoreA, state: sa, dynamics: da, coords: coords3D(sa), evidence: evidenceConfidence(ayar) },
      lightmatter: { score: scoreL, state: sl, dynamics: dl, coords: coords3D(sl), evidence: evidenceConfidence(lightmatter) }
    };
  });
}

export function liveCompanies(ayar, lightmatter) {
  const sa = buildStateVector(ayar);
  const sl = buildStateVector(lightmatter);
  const da = computeDynamics(ayar, sa);
  const dl = computeDynamics(lightmatter, sl);
  return [
    { id: "ayar", name: ayar.name, state: sa, dynamics: da, coords: coords3D(sa), evidence: evidenceConfidence(ayar) },
    { id: "lightmatter", name: lightmatter.name, state: sl, dynamics: dl, coords: coords3D(sl), evidence: evidenceConfidence(lightmatter) }
  ];
}

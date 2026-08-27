# Live SHA-128 Hydration Diagnosis

**Source URL:** https://a1dmitry.github.io/Ricis3-Expansion-Map/  
**Observed before fix:** `Ошибка загрузки БД: [object Object]`  
**Live asset observed:** `/Ricis3-Expansion-Map/assets/mapStore-DSHVuK1O.js`  
**Deployment run for fix:** https://github.com/A1Dmitry/Ricis3-Expansion-Map/actions/runs/33117875219  
**Deployment status:** success

The live mapStore asset showed IndexedDB database `ricis3-map-db`, stores `nodes`, `edges`, `zones`, `axioms`, `proofs`, `meta`, and a startup path that loads IndexedDB then runs migration. The local reproducer confirmed that a migrated SHA-128 graph plus appended legacy seed nodes throws:

```json
{"kind":"identity_collision","paths":["/целевая-функция-agi-ricis-core"],"legacyIds":["6d610aedda58ff1ec640c2598a5c15ff","core-agi-target"]}
```

The deployment after PR #12 completed successfully. Live recheck must use the canonical URL with a cache-busting query and verify that the root no longer renders the fatal database error.

# Auto-enregistrement des préférences propres à ce projet

Toute nouvelle préférence, correction ou règle d'écriture **spécifique à ce
projet** que l'utilisateur exprime doit être enregistrée dans `.claude/rules/`
de CE repo — **pas** dans la mémoire globale (`~/.claude/memory/`) ni dans
`~/.claude/rules/`.

## Quand sauvegarder ici

- Conventions de code propres à cette stack (libs, frameworks utilisés ici)
- Choix d'architecture spécifiques au repo
- Pièges déjà rencontrés ou à éviter dans ce projet
- Préférences de style, naming, organisation valables UNIQUEMENT ici
- Toute formulation du type « dans ce projet, on… » / « pour ce repo, fais… »

## Quand sauvegarder globalement à la place

Si la règle s'applique à **tous** les projets de l'utilisateur (TypeScript en
général, conventions de naming TS universelles, agent-naming, etc.), passer
par `~/.claude/rules/` ou la mémoire globale. En cas de doute, préférer le
local : c'est plus simple à découvrir pour une future session Claude qui
ouvre ce repo.

## Comment

- 1 fichier = 1 sujet, nom en kebab-case : `.claude/rules/<sujet>.md`
- Titre `# <Sujet>` en h1, contenu markdown standard derrière
- Si un fichier de règle proche existe déjà, **mettre à jour** plutôt que
  dupliquer
- Commit le fichier de règle dans le **même commit** que le changement qui a
  motivé la règle (pour que l'historique soit cohérent)

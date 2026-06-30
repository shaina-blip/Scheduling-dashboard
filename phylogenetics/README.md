# Caribbean *Anolis* phylogeny (mtDNA)

Phylogenetic trees built from the mitochondrial DNA sequences of eight Greater
Antillean *Anolis* species, rooted with *Leiocephalus carinatus* as the outgroup.

## Inputs

`sequences.fasta` — 9 sequences (~1.4 kb of mtDNA spanning ND2 + flanking tRNAs).

## Pipeline

| Step | Tool | Output |
|------|------|--------|
| Multiple sequence alignment | MAFFT `--auto` | `aligned.fasta` (1456 cols) |
| Maximum-likelihood tree | FastTree `-nt -gtr -gamma` | `ml_tree.nwk` → `ml_tree.rooted.nwk` |
| Neighbour-joining + bootstrap | Biopython (p-distance, 100 reps) | `nj_tree.rooted.nwk` |
| Rendering | Biopython + matplotlib | `ml_tree.png/.svg`, `nj_tree.png/.svg` |

Reproduce with:

```bash
mafft --auto sequences.fasta > aligned.fasta
FastTree -nt -gtr -gamma aligned.fasta > ml_tree.nwk
python3 build_trees.py
```

Branch labels are SH-like local support (ML tree, 0–1) and bootstrap percentages
(NJ tree, 0–100).

## Ecomorph colouring

Branches and tip labels are coloured by Greater Antillean ecomorph class:

| Colour | Ecomorph | Species |
|--------|----------|---------|
| 🟢 Green | Trunk-crown | *A. evermanni*, *A. coelestinus* |
| 🔴 Red | Twig | *A. occultus*, *A. sheplani* |
| 🟤 Brown | Trunk-ground | *A. cristatellus*, *A. cybotes* |
| 🟡 Yellow | Grass-bush | *A. olssoni*, *A. pulchellus* |
| ⚫ Grey | Outgroup | *Leiocephalus carinatus* |

## Note on the topology

The ecomorph classes are **not** monophyletic on the tree — e.g. the two twig
anoles (*occultus*, *sheplani*) and the two trunk-ground anoles (*cristatellus*,
*cybotes*) do not group together. This is the classic signature of **convergent
evolution**: the same habitat-specialist body plans evolved independently on
different islands rather than being inherited from a shared ecomorph ancestor.

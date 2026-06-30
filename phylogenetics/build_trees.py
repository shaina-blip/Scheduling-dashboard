#!/usr/bin/env python3
"""Build and render phylogenetic trees for Caribbean Anolis (+ Leiocephalus outgroup).

Pipeline:
  1. Read the MAFFT alignment.
  2. Build a Maximum-Likelihood tree (FastTree, GTR+Gamma) - read from ml_tree.nwk.
  3. Build a bootstrapped Neighbour-Joining tree (Bio.Phylo) as an independent check.
  4. Root both on the Leiocephalus carinatus outgroup.
  5. Render both, colouring branches by Greater Antillean ecomorph class.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from Bio import AlignIO, Phylo
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor
from Bio.Phylo.Consensus import bootstrap_trees, get_support
import copy

OUTGROUP = "Leiocephalus_carinatus"

# Greater Antillean ecomorph assignments for the sampled species.
ECOMORPH = {
    "Anolis_evermanni":     "trunk-crown",
    "Anolis_coelestinus":   "trunk-crown",
    "Anolis_occultus":      "twig",
    "Anolis_sheplani":      "twig",
    "Anolis_cristatellus":  "trunk-ground",
    "Anolis_cybotes":       "trunk-ground",
    "Anolis_olssoni":       "grass-bush",
    "Anolis_pulchellus":    "grass-bush",
    OUTGROUP:               "outgroup",
}

COLORS = {
    "trunk-crown":  "#2ca02c",  # green
    "twig":         "#d62728",  # red
    "trunk-ground": "#8c564b",  # brown
    "grass-bush":   "#e8b800",  # yellow / gold
    "outgroup":     "#555555",  # grey
}


def color_for_clade(clade):
    """Return the ecomorph colour shared by all tips below a clade, else grey."""
    tips = [t.name for t in clade.get_terminals()]
    morphs = {ECOMORPH.get(t, "outgroup") for t in tips}
    if len(morphs) == 1:
        return COLORS[morphs.pop()]
    return "#999999"  # mixed internal branch


def style_tree(tree):
    """Assign branch colours and bold-ish width by ecomorph."""
    for clade in tree.find_clades():
        col = color_for_clade(clade)
        clade.color = col


def render(tree, title, outfile):
    style_tree(tree)
    fig, ax = plt.subplots(figsize=(11, 6.5))

    def label(clade):
        if clade.is_terminal():
            return clade.name.replace("_", " ")
        return ""  # don't print confidence as the tip label

    def conf_label(c):
        if c.confidence is None or c.is_terminal():
            return ""
        # bootstrap counts come back as 0-100; ML SH-like supports as 0-1
        return f"{c.confidence:.0f}" if c.confidence > 1 else f"{c.confidence:.2f}"

    Phylo.draw(
        tree, axes=ax, do_show=False, label_func=label,
        show_confidence=False, branch_labels=conf_label,
    )

    # Recolour the tip text to match its ecomorph.
    for txt in ax.texts:
        name = txt.get_text().strip().replace(" ", "_")
        if name in ECOMORPH:
            txt.set_color(COLORS[ECOMORPH[name]])
            txt.set_fontweight("bold")
            txt.set_fontstyle("italic")

    ax.set_title(title, fontsize=13, fontweight="bold")
    ax.set_xlabel("substitutions per site")
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.set_yticks([])

    legend_items = [
        Line2D([0], [0], color=COLORS["trunk-crown"], lw=3, label="Trunk-crown"),
        Line2D([0], [0], color=COLORS["twig"], lw=3, label="Twig"),
        Line2D([0], [0], color=COLORS["trunk-ground"], lw=3, label="Trunk-ground"),
        Line2D([0], [0], color=COLORS["grass-bush"], lw=3, label="Grass-bush"),
        Line2D([0], [0], color=COLORS["outgroup"], lw=3, label="Outgroup (Leiocephalus)"),
    ]
    ax.legend(handles=legend_items, title="Ecomorph", loc="center left",
              bbox_to_anchor=(0.02, 0.42), frameon=True, fontsize=9,
              title_fontsize=10)

    fig.tight_layout()
    fig.savefig(outfile, dpi=200, bbox_inches="tight")
    fig.savefig(outfile.replace(".png", ".svg"), bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {outfile}")


# ---------------------------------------------------------------- ML tree
ml = Phylo.read("ml_tree.nwk", "newick")
ml.root_with_outgroup({"name": OUTGROUP})
ml.ladderize()
Phylo.write(ml, "ml_tree.rooted.nwk", "newick")
render(ml, "Maximum-Likelihood tree (FastTree, GTR+Γ)\nCaribbean $Anolis$ mtDNA",
       "ml_tree.png")

# ---------------------------------------------------------------- NJ tree + bootstrap
aln = AlignIO.read("aligned.fasta", "fasta")
calc = DistanceCalculator("identity")
constructor = DistanceTreeConstructor(calc, "nj")

nj = constructor.build_tree(aln)
# bootstrap support: count how many of 100 replicate trees recover each NJ clade
replicates = list(bootstrap_trees(aln, 100, constructor))
nj = get_support(nj, replicates)  # writes confidence (0-100) onto every internal node

nj.root_with_outgroup({"name": OUTGROUP})
nj.ladderize()
Phylo.write(nj, "nj_tree.rooted.nwk", "newick")
render(nj, "Neighbour-Joining tree (p-distance, 100 bootstraps)\nCaribbean $Anolis$ mtDNA",
       "nj_tree.png")

print("\nML rooted topology:")
Phylo.draw_ascii(ml)
print("\nNJ rooted topology (branch labels = bootstrap %):")
Phylo.draw_ascii(nj)

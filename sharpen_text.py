import io, sys

def apply(path, replacements):
    with io.open(path, "r", encoding="utf-8") as f:
        src = f.read()
    for old, new, multi in replacements:
        count = src.count(old)
        if count == 0:
            print(f"FAILED in {path}: not found -> {old[:70]}...")
            sys.exit(1)
        if count > 1 and not multi:
            print(f"FAILED in {path}: {count} matches (need allow_multiple) -> {old[:70]}...")
            sys.exit(1)
        src = src.replace(old, new)
        print(f"OK {path}: {count}x -> {old[:60]}...")
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(src)

# 1. index.css — font smoothing + legibility on html too
apply("src/index.css", [
    ("  html {\n    scroll-behavior: smooth;\n  }",
     "  html {\n    scroll-behavior: smooth;\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n    text-rendering: optimizeLegibility;\n  }",
     False),
])

# 2. Landing.tsx — strip backdrop-filters from text-bearing containers, bump heading weight
apply("src/pages/Landing.tsx", [
    ("bg-white/80 p-2 backdrop-blur-md dark:border-white/10 dark:bg-white/5",
     "bg-white/80 p-2 dark:border-white/10 dark:bg-white/5", False),
    ("bg-black/5 text-black/60 backdrop-blur-md transition-colors",
     "bg-black/5 text-black/60 transition-colors", False),
    ("shadow-[0_0_18px_rgba(37,211,102,0.18)] backdrop-blur-md dark:border-[#25D366]/30",
     "shadow-[0_0_18px_rgba(37,211,102,0.18)] dark:border-[#25D366]/30", False),
    ("dark:bg-[#080808] dark:backdrop-blur-sm", "dark:bg-[#080808]", True),
    ("bg-white/20 text-white backdrop-blur-md transition-all", "bg-white/20 text-white transition-all", False),
    ("text-[#0B4F37] backdrop-blur-md transition-all", "text-[#0B4F37] transition-all", False),
    ("font-display text-4xl font-medium tracking-tight text-gradient-silver",
     "font-display text-4xl font-semibold tracking-tight text-gradient-silver", False),
])

# 3. Dashboard.tsx — strip backdrop-filters
apply("src/pages/Dashboard.tsx", [
    ("border-white/10 bg-white/5 text-white backdrop-blur-md transition-colors",
     "border-white/10 bg-white/5 text-white transition-colors", True),
    ("bg-[#080808] p-5 backdrop-blur-sm", "bg-[#080808] p-5", False),
    ("bg-[#080808] p-4 backdrop-blur-sm", "bg-[#080808] p-4", False),
    ("bg-[#080808] px-6 py-16 text-center backdrop-blur-sm", "bg-[#080808] px-6 py-16 text-center", True),
    ('"rounded-2xl border bg-[#080808] p-5 backdrop-blur-sm transition-all duration-300"',
     '"rounded-2xl border bg-[#080808] p-5 transition-all duration-300"', False),
])

# 4. Auth.tsx — strip backdrop-filter
apply("src/pages/Auth.tsx", [
    ("rounded-2xl border border-white/10 bg-[#080808] pb-0 shadow-none backdrop-blur-md",
     "rounded-2xl border border-white/10 bg-[#080808] pb-0 shadow-none", False),
])

print("All done")

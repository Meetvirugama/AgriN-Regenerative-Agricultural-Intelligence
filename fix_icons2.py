import os
import glob
import re

directory = 'client/src/components/hover-ui'
files = glob.glob(os.path.join(directory, '*.jsx'))

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Inject hover-icon.css if not present
    if 'import "./hover-icon.css";' not in content:
        content = re.sub(
            r'import { motion, useAnimate } from "framer-motion";',
            r'import { motion, useAnimate } from "framer-motion";\nimport "./hover-icon.css";',
            content
        )

    # 2. Fix remaining Tailwind classes
    content = content.replace('className={`cursor-pointer ${className}`}', 'className={`hover-icon-wrapper ${className}`}')
    content = content.replace('className={`inline-flex cursor-pointer ${className}`}', 'className={`hover-icon-wrapper ${className}`}')
    content = content.replace('className={`bulb-icon cursor-pointer ${className}`}', 'className={`hover-icon-wrapper bulb-icon ${className}`}')

    with open(filepath, 'w') as f:
        f.write(content)

print(f"Processed {len(files)} files again.")

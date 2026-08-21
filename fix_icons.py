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

    # 2. Fix the Tailwind classes
    content = re.sub(
        r'className=\{`inline-flex cursor-pointer items-center justify-center \$\{className\}`\}',
        r'className={`hover-icon-wrapper ${className}`}',
        content
    )
    content = re.sub(
        r'className="inline-flex cursor-pointer items-center justify-center"',
        r'className="hover-icon-wrapper"',
        content
    )

    # 3. Add useEffect to respond to isHovered if missing
    if 'useEffect(() => {' not in content and 'isHovered' in content:
        # We need to find the `handleHoverEnd` function to insert the useEffect right after it.
        # Alternatively, we can inject it right before the `return (` statement of the component.
        injection = """
    useEffect(() => {
      if (isHovered) {
        start();
      } else {
        stop();
      }
    }, [isHovered]);

    return ("""
        content = re.sub(r'\s+return\s*\(', injection, content, count=1)
        
        # Ensure useEffect is imported
        if 'useEffect' not in content.split('import { motion')[0]:
            content = content.replace('import { forwardRef, useImperativeHandle }', 'import { forwardRef, useImperativeHandle, useEffect }')
            content = content.replace('import { forwardRef, useImperativeHandle , useEffect }', 'import { forwardRef, useImperativeHandle, useEffect }')

    with open(filepath, 'w') as f:
        f.write(content)

print(f"Processed {len(files)} files.")

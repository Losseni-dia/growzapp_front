/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (
      p.endsWith(".css") &&
      !p.includes("node_modules") &&
      !p.endsWith("theme.css")
    ) {
      let s = fs.readFileSync(p, "utf8");
      const orig = s;

      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.04\s*\)/gi, "var(--growz-veil-04)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.05\s*\)/gi, "var(--growz-veil-05)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.08\s*\)/gi, "var(--growz-veil-08)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.1\s*\)/gi, "var(--growz-veil-10)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.12\s*\)/gi, "var(--growz-veil-12)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.15\s*\)/gi, "var(--growz-veil-15)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.18\s*\)/gi, "var(--growz-veil-18)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.2\s*\)/gi, "var(--growz-veil-20)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.25\s*\)/gi, "var(--growz-veil-25)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.3\s*\)/gi, "var(--growz-veil-30)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.4\s*\)/gi, "var(--growz-veil-40)");
      s = s.replace(/rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.5\s*\)/gi, "var(--growz-veil-50)");
      s = s.replace(
        /rgba\(\s*27\s*,\s*94\s*,\s*32\s*,\s*0\.\d+\s*\)/gi,
        (m) => {
          const n = m.match(/0\.\d+/);
          if (!n) return m;
          const a = n[0];
          const map = {
            "0.04": "04",
            "0.05": "05",
            "0.08": "08",
            "0.1": "10",
            "0.12": "12",
            "0.15": "15",
            "0.18": "18",
            "0.2": "20",
            "0.25": "25",
            "0.3": "30",
            "0.4": "40",
            "0.5": "50",
          };
          const v = map[a];
          return v ? `var(--growz-veil-${v})` : m;
        }
      );
      s = s.replace(/#1B5E20/g, "var(--growz-primary)");
      s = s.replace(/#1b5e20/g, "var(--growz-primary)");
      s = s.replace(/#2E7D32/g, "var(--growz-green-700)");
      s = s.replace(/#2e7d32/g, "var(--growz-green-700)");
      s = s.replace(/#4CAF50/g, "var(--growz-green-500)");
      s = s.replace(/#4caf50/g, "var(--growz-green-500)");
      s = s.replace(/#66BB6A/g, "var(--growz-green-400)");
      s = s.replace(/#66bb6a/g, "var(--growz-green-400)");
      s = s.replace(/#388E3C/g, "var(--growz-green-600)");
      s = s.replace(/#388e3c/g, "var(--growz-green-600)");
      s = s.replace(/#219653/g, "var(--growz-green-700)");
      s = s.replace(/#27ae60/g, "var(--growz-green-500)");
      s = s.replace(/#FFC107/g, "var(--growz-gold)");
      s = s.replace(/#ffc107/g, "var(--growz-gold)");
      s = s.replace(/#ffb300/g, "var(--growz-gold-dark)");
      s = s.replace(/#E8F5E9/g, "var(--growz-mint-50)");
      s = s.replace(/#e8f5e9/g, "var(--growz-mint-50)");
      s = s.replace(/#C8E6C9/g, "var(--growz-mint-100)");
      s = s.replace(/#c8e6c9/g, "var(--growz-mint-100)");
      s = s.replace(/#E8F3EA/g, "var(--growz-mint-50)");
      s = s.replace(/#173d17/g, "var(--growz-primary-pressed)");

      if (s !== orig) {
        fs.writeFileSync(p, s);
        console.log("updated", path.relative(path.join(__dirname, ".."), p));
      }
    }
  }
}

walk(root);
console.log("theme apply done");

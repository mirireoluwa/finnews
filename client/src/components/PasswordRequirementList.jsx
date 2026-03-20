import { getPasswordRuleResults } from "../utils/passwordRules.js";

export default function PasswordRequirementList({ password }) {
  const results = getPasswordRuleResults(password);
  const allMet = results.every((r) => r.met);

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        borderRadius: 10,
        background: "var(--accent-soft)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Password requirements
      </p>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {results.map((r) => (
          <li
            key={r.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 12,
              color: r.met ? "var(--positive)" : "var(--text-muted)",
              fontWeight: r.met ? 600 : 500,
              lineHeight: 1.4,
            }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
              {r.met ? "✓" : "○"}
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
      {password && (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 12,
            fontWeight: 700,
            color: allMet ? "var(--positive)" : "var(--text-muted)",
          }}
        >
          {allMet ? "All requirements met." : "Keep typing until every item is checked."}
        </p>
      )}
    </div>
  );
}

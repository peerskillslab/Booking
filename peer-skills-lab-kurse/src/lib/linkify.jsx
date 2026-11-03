import React from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

// Macht aus Web-Adressen im Text anklickbare Links, alles andere bleibt Text.
// Satzzeichen am Ende der Adresse gehören nicht zum Link.
export function linkify(text, linkStyle) {
  if (typeof text !== "string" || !text) return text;
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const m = part.match(/^(.*?)([.,;:!?)]*)$/);
    const url = m[1];
    const trailing = m[2];
    return (
      <React.Fragment key={i}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", ...linkStyle }}>
          {url}
        </a>
        {trailing}
      </React.Fragment>
    );
  });
}

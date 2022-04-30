import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="/">
      <PageHeader
        title="👛 multisig.lol"
        subTitle={(<a href="https://github.com/austintgriffith/maas" target="_blank">please fork this</a>)}
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}

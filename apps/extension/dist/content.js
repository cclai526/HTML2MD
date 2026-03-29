chrome.runtime.onMessage.addListener((e,o,n)=>{if(e.action==="getHTML"){const t=document.querySelector("article")||document.body;n({html:t.innerHTML})}});

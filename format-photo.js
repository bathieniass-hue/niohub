const styleFormatPhoto=document.createElement('style');
styleFormatPhoto.textContent=`
#apercu,#fphoto,.card .img{aspect-ratio:9/10 !important;height:auto !important;width:100%;}
.card{height:auto !important;display:flex;flex-direction:column;}
.card .info{position:static !important;padding:8px 4px 4px !important;}
`;
document.head.appendChild(styleFormatPhoto);

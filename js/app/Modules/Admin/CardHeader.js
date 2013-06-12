Ext.define('Optima5.Modules.Admin.CardHeader',{
	extend: 'Ext.Component',
	tpl:[
		'<div class="op5-admin-cardheader-wrap">',
		'<span class="op5-admin-cardheader-title">{title}</span>',
		'<br>',
		'<span class="op5-admin-cardheader-caption">{caption}</span>',
		'<div class="op5-admin-cardheader-icon {iconCls}"></div>',
		'</div>'
	]
}) ;
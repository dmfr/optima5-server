Ext.define('Optima5.Modules.Settings.CardHeader',{
	extend: 'Ext.Component',
	tpl:[
		'<div class="op5-settings-cardheader-wrap">',
		'<span class="op5-settings-cardheader-title">{title}</span>',
		'<br>',
		'<span class="op5-settings-cardheader-caption">{caption}</span>',
		'<div class="op5-settings-cardheader-icon {iconCls}"></div>',
		'</div>'
	]
}) ;
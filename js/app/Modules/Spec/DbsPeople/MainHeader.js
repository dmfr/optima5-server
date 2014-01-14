Ext.define('Optima5.Modules.Spec.DbsPeople.MainHeader',{
	extend: 'Ext.Component',
	tpl:[
		'<div class="op5-dbspeople-mainheader-wrap">',
		'<span class="op5-dbspeople-mainheader-title">{title}</span>',
		'<br>',
		'<span class="op5-dbspeople-mainheader-caption">{caption}</span>',
		'<div class="op5-dbspeople-mainheader-icon {iconCls}"></div>',
		'</div>'
	]
}) ;
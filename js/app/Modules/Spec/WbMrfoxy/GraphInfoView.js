Ext.define('Optima5.Modules.Spec.WbMrfoxy.GraphInfoView',{
	extend: 'Ext.view.View',
	
	alias: 'widget.op5specmrfoxygraphinfo',
	
	cls: 'op5-spec-mrfoxy-graphinfo',
	tpl: [
		'<tpl for=".">',
			'<div class="op5-spec-mrfoxy-graphinfo-item">',
				'{text}',
				'<div class="op5-spec-mrfoxy-graphinfo-item-icon {iconCls}"></div>',
			'</div>',
		'</tpl>'
	],
	itemSelector: 'div.op5-spec-mrfoxy-graphinfo-item',
	store: {
		fields: ['iconCls', 'text'],
		data:[
			{iconCls: 'op5-spec-mrfoxy-graphinfo-baseline', text:'Baseline'},
			{iconCls: 'op5-spec-mrfoxy-graphinfo-uplift', text:'Uplift'}
		]
	}
});
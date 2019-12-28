Ext.define('RsiRecouveoReportTileComponentModel',{
	extend: 'Ext.data.Model',
	idProperty: 'reportval_id',
	fields: [
		{name: 'reportval_id', type: 'string'},
		{name: 'reportval_txt', type: 'string'},
		{name: 'caption_txt', type: 'string'},
		{name: 'main_iconCls', type: 'string'},
		{name: 'main_value', type: 'number', allowNull: true},
		{name: 'main_suffix', type: 'string'},
		{name: 'eval_value', type: 'number', allowNull: true},
		{name: 'eval_suffix', type: 'string'},
		{name: 'eval_direction', type: 'string'}
	]
});
Ext.define('RsiRecouveoReportTileModel',{
	extend: 'Ext.data.Model',
	idProperty: 'reportval_id',
	fields: [
		{name: 'timescale', type: 'string'},
		{name: 'reportval_id', type: 'string'},
		{name: 'reportval_txt', type: 'string'}
	],
	hasMany: [{
		model: 'RsiRecouveoReportTileComponentModel',
		name: 'components',
		associationKey: 'components'
	}]
});


Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
	extend: 'Ext.Component',
	tpl: [
		'<tpl if="caption">',
		'<div class="op5-spec-rsiveo-reporttile-caption">{caption}</div>',
		'<tpl else>',
		'<div class="op5-spec-rsiveo-reporttile-caption">&nbsp;</div>',
		'</tpl>',
		'<div class="op5-spec-rsiveo-reporttile-main">',
			'<div class="op5-spec-rsiveo-reporttile-main-text">{main_value}&nbsp;{main_suffix}</div>',
			'<div class="op5-spec-rsiveo-reporttile-main-icon {main_iconCls}"></div>',
		'</div>',
		'<tpl if="eval_caption">',
		'<hr>',
		'<div class="op5-spec-rsiveo-reporttile-eval-caption">{eval_caption}</div>',
		'<div class="op5-spec-rsiveo-reporttile-eval">',
			'<div class="op5-spec-rsiveo-reporttile-eval-text">(&nbsp;{eval_value}&nbsp;{eval_suffix}&nbsp;)</div>',
			'<div class="op5-spec-rsiveo-reporttile-eval-icon {eval_iconCls}"></div>',
		'</div>',
		'</tpl>',
	],
	initComponent: function() {
		Ext.apply(this,{
			cls: 'op5-spec-rsiveo-reporttile',
		}) ;
		this.callParent() ;
		this.on('afterrender',function() {
			if( this.tileData && this.cmpData ) {
				this.formatData(this.tileData,this.cmpData) ;
			}
			this.doAttachListener( this.getEl() ) ;
		},this) ;
	},
	doAttachListener: function(el) {
		el.on('click',this.onElClick,this) ;
	},
	onElClick: function() {
		this.fireEvent('click',this) ;
	},
	formatData: function( tileData,cmpData ) {
		this.reportval_id = cmpData.reportval_id ;
		var eval_iconCls = '' ;
		switch( cmpData.eval_direction ) {
			case 'more-good' :
			case 'more-bad' :
			case 'less-good' :
			case 'less-bad' :
				eval_iconCls = 'op5-spec-rsiveo-reporttile-main-icon-'+cmpData.eval_direction ;
				break ;
		}
		
		var eval_caption = '' ;
		switch( tileData.timescale ) {
			case 'milestone' :
				eval_caption = 'Début période' ;
				break ;
			case 'interval' :
				eval_caption = 'Période précédente' ;
				break ;
		}
		
		var data = {
			caption: cmpData.caption_txt,
			main_value: cmpData.main_value.toLocaleString(),
			main_suffix: cmpData.main_suffix,
			main_iconCls: cmpData.main_iconCls,
			eval_caption: eval_caption,
			eval_value: cmpData.eval_value,
			eval_suffix: cmpData.eval_suffix,
			eval_iconCls: eval_iconCls
		} ;
		this.update(data) ;
	},
	update: function(data) {
		switch( data.eval_direction ) {
			case 'more-good' :
			case 'more-bad' :
			case 'less-good' :
			case 'less-bad' :
				data.eval_iconCls = 'op5-spec-rsiveo-reporttile-main-icon-'+data.eval_direction ;
				break ;
		}
		arguments[0] = data ;
		this.callParent(arguments) ;
	}
}) ;

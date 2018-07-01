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
		'<hr>',
		'<div class="op5-spec-rsiveo-reporttile-eval-caption">{eval_caption}</div>',
		'<div class="op5-spec-rsiveo-reporttile-eval">',
			'<div class="op5-spec-rsiveo-reporttile-eval-text">(&nbsp;{eval_value}&nbsp;{eval_suffix}&nbsp;)</div>',
			'<div class="op5-spec-rsiveo-reporttile-eval-icon {eval_iconCls}"></div>',
		'</div>',
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
			main_value: cmpData.main_value,
			main_suffix: cmpData.main_suffix,
			main_iconCls: cmpData.main_iconCls,
			eval_caption: eval_caption,
			eval_value: cmpData.eval_value,
			eval_suffix: cmpData.eval_suffix,
			eval_iconCls: eval_iconCls
		} ;
		this.update(data) ;
	}
}) ;


Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',{
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreporttilespanel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: []
		}) ;
		this.callParent() ;
		this.onDateSet('month') ;
		this.ready=true ;
		this.doLoad() ;
	},
	
	onTbarChanged: function( filterValues ) {
		this.doLoad() ;
	},
	
	doLoad: function() {
		if( !this.ready ) {
			return ;
		}
		this.removeAll() ;
		this.add({
			xtype: 'box',
			cls:'op5-waiting',
			height: 150
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getTiles',
				filters: Ext.JSON.encode(this.getFilterValues()),
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData) {
		this.removeAll() ;
		
		var myStore = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoReportTileModel',
			data: ajaxData,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		var filterData = this.getFilterValues() ;
		
		// A date
		myStore.clearFilter() ;
		myStore.filter('timescale','milestone') ;
		if( myStore.getCount() > 0 ) {
			tilePanels = [] ;
			myStore.each( function(tileRecord) {
				var components = [] ;
				tileRecord.components().each( function(tileCmpRecord) {
					components.push(tileCmpRecord.getData()) ;
				}) ;
				
				tilePanels.push( this.createTilePanel(tileRecord.getData(),components) );
			},this) ;
			var subPanel = Ext.create('Ext.panel.Panel',{
				layout: 'column',
				items: tilePanels
			}) ;
			this.add({
				xtype: 'component',
				html: 'En date du '+''
			});
			this.add(subPanel) ;
		}
		
		this.add({
			xtype: 'component',
			html: '<hr>'
		});
		
		// Interval
		myStore.clearFilter() ;
		myStore.filter('timescale','interval') ;
		if( myStore.getCount() > 0 ) {
			tilePanels = [] ;
			myStore.each( function(tileRecord) {
				var components = [] ;
				tileRecord.components().each( function(tileCmpRecord) {
					components.push(tileCmpRecord.getData()) ;
				}) ;
				
				tilePanels.push( this.createTilePanel(tileRecord.getData(),components) );
			},this) ;
			var subPanel = Ext.create('Ext.panel.Panel',{
				layout: 'column',
				items: tilePanels
			}) ;
			
			this.add({
				xtype: 'component',
				html: 'Intervalle du '+''+' au '+''
			});
			this.add(subPanel) ;
		}
		
		
		
		this.setScrollable('vertical') ;
	},
	createTilePanel: function(tileData,dataComponents) {
		var cmps = [] ;
		Ext.Array.each( dataComponents, function(cmpData) {
			cmps.push( Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTileComponent',{
				flex: 1,
				tileData: tileData,
				cmpData: cmpData,
				listeners: {
					click: this.onTileClick,
					scope: this
				}
			}) );
		},this) ;
		var p = Ext.create('Ext.panel.Panel',{
			title: tileData.reportval_txt,
			margin: 10,
			frame: true,
			width: (cmps.length>1 ? 400 : 300),
			height: 200,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: cmps
		}) ;
		
		return p ;
		/*
		this.add( Ext.create('Ext.panel.Panel',{
			title: 'Titre de la tuile',
			margin: 10,
			frame: true,
			width: 300,
			height: 200,
			layout: 'fit',
			items: [{
				xtype: 'polar',
				height: 240,
				width: 300,
				padding: '10 0 0 0',
				store: {
					fields: ['mph', 'fuel', 'temp', 'rpm' ],
					data: [
						{ mph: 65, fuel: 50, temp: 150, rpm: 6000 }
					]
				},
				insetPadding: 30,
				axes: {
					title: 'Temp',
					type: 'numeric',
					position: 'gauge',
					maximum: 250,
					majorTickSteps: 2,
					renderer: function (v) {
							if (v === 0) return 'Cold';
							if (v === 125) return 'Comfortable';
							if (v === 250) return 'Hot';
							return ' ';
					}
				},
				series: {
					type: 'gauge',
					field: 'temp',
					donut: 50
				}
			}]
		}) ) ;
		*/
	},
	
	onTileClick: function(tileCmp) {
		this.fireEvent('opengrid',this,tileCmp.reportval_id) ;
	}
}) ;

Ext.define('DbsEmbramachMenuItemModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'item_disabled',  type: 'boolean'},
		{name: 'type_header',  type: 'boolean'},
		{name: 'type_separator',   type: 'boolean'},
		{name: 'type_action',   type: 'boolean'},
		{name: 'separator_label',   type: 'string'},
		{name: 'action_iconCls',   type: 'string'},
		{name: 'action_qtip',   type: 'string'},
		{name: 'action_caption',   type: 'string'},
		{name: 'action_sendEvent', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsEmbramach.MainMenu',{
	extend:'Ext.view.View',
	requires:[
	],
	
	initComponent: function() {
		 var viewItemTpl = new Ext.XTemplate(
			'<tpl for=".">',
			'<tpl if="!item_disabled">',
			'<div class="op5-spec-dbsembramach-mainmenu-item">',
				'<tpl if="type_header">',
					'<div class="op5-spec-dbsembramach-mainmenu-header"></div>',
				'</tpl>',
				
				'<tpl if="type_separator">',
					'<div class="x-clear"></div>',
					'<div class="op5-spec-dbsembramach-mainmenu-separator">{separator_label}</div>',
				"</tpl>",
			
				'<tpl if="type_action">',
					'<div class="op5-spec-dbsembramach-mainmenu-action">',
						'<div class="op5-spec-dbsembramach-mainmenu-action-icon {action_iconCls}" data-qtip="{action_qtip:htmlEncode}"></div>',
						'<span>{action_caption:htmlEncode}</span>',
					'</div>',
				'</tpl>',
			'</div>',
			'</tpl>',
			'<tpl if="item_disabled">',
				'<div class="op5-spec-dbsembramach-mainmenu-item" style="display:none">',
				'&#160;',
				'</div>',
			'</tpl>',
			'</tpl>'
		);
		 
		var itemsStore = Ext.create('Ext.data.Store',{
			model:'DbsEmbramachMenuItemModel',
			data:[{
				type_header:true
			},{
				type_separator:true,
				separator_label: 'DBS MACH : Suivi de l\'activité'
			},{
				type_action:true,
				action_caption: 'Dashboard MACH',
				action_sendEvent:'panel_mach',
				action_iconCls:'op5-spec-dbsembramach-icon-mach'
			},{
				type_action:true,
				action_caption: 'Report KPI',
				action_sendEvent:'panel_report',
				action_iconCls:'op5-spec-dbsembramach-icon-report'
			},{
				type_separator:true,
				separator_label: 'DBS TraMoS'
			},{
				type_action:true,
				action_caption: 'Query:MB51',
				action_sendEvent:'panel_query_mb51',
				action_iconCls:'op5-spec-dbsembramach-icon-report'
			}]
		}) ;
		 
		Ext.apply(this,{
			cls: 'op5-spec-dbsembramach-mainmenu',
			tpl: viewItemTpl,
			itemSelector: 'div.op5-spec-dbsembramach-mainmenu-item',
			overItemCls: 'op5-spec-dbsembramach-mainmenu-item-over',
			store: itemsStore,
			stateId: "mainmenu",
			stateful: true
		}) ;
		
		this.on('viewready',this.arrangeItems,this,{single:true}) ;
		this.on('resize',this.arrangeItems,this) ;
		this.on('itemclick',this.itemClicked,this) ;
		this.callParent() ;
	},
	
	arrangeItems: function() {
		var me = this,
			viewStore = me.getStore() ;
		
		if( me.getNodes().length != viewStore.getCount() ) {
			return ;
		}
		
		var currentGrp = -1,
			header,
			arrSeparators = [],
			arrArrItems = [] ;
		me.getStore().each( function(record) {
			if( record.get('type_header') ) {
				header = record ;
				return ;
			}
			if( record.get('type_separator') ) {
				currentGrp++ ;
				arrSeparators.push(record);
				arrArrItems.push([]) ;
				return ;
			}
			if( record.get('type_action') ) {
				arrArrItems[currentGrp].push(record) ;
				return ;
			}
		},me) ;
		
		
		// Box de la fenetre
		var viewBox = me.getEl().getBox(),
			viewWidth = viewBox.width,
			viewCenter = ( viewWidth / 2 ) ;
			
		var currentHeight = 0 ;
		
		// alignement du header
		var headerEl = Ext.get(me.getNode(header)),
			headerBox = headerEl.getBox(),
			headerHeight = headerBox.height,
			headerWidth = headerBox.width,
			headerLeft = ( viewCenter ) - ( headerWidth / 2 ) ;
		headerEl.setLocalXY( headerLeft , currentHeight ) ;
		currentHeight += headerHeight ;
		
		var separatorWidth = Math.min( 600, viewWidth ) ;
		
		
		var i, j, separatorEl, separatorBox ;
		for( i=0; i<arrSeparators.length ; i++ ) {
			separatorEl = Ext.get(me.getNode(arrSeparators[i])) ;
			separatorBox = separatorEl.getBox() ;
			
			separatorEl.setWidth(separatorWidth) ;
			separatorEl.setLocalXY( viewCenter-(separatorWidth/2) , currentHeight ) ;
			
			currentHeight += separatorBox.height ;
			
			var rowWidth = 0 , rowHeight = 0 ;
			for( j=0; j<arrArrItems[i].length ; j++ ) {
				var itemEl = Ext.get(me.getNode(arrArrItems[i][j])),
					itemBox = itemEl.getBox() ;
				rowWidth += itemBox.width ;
				if( itemBox.height > rowHeight ) {
					rowHeight = itemBox.height ;
				}
			}
			var xCursor = ( viewWidth - rowWidth ) / 2 ;
			for( j=0; j<arrArrItems[i].length ; j++ ) {
				var itemEl = Ext.get(me.getNode(arrArrItems[i][j])) ;
				// console.log( xCursor + ' ' +currentHeight ) ;
				itemEl.setLocalXY( xCursor, currentHeight ) ;
				xCursor += itemEl.getBox().width ;
				// console.dir( itemEl.getBox() ) ;
			}
			currentHeight += rowHeight ;
		}
	},
	itemClicked: function( view, record ) {
		var me = this ;
		if( record.get('type_action') && record.get('action_sendEvent') != '' ) {
			// console.log('Send event '+record.get('action_sendEvent') ) ;
			me.fireEvent('actionclick',view,record.get('action_sendEvent')) ;
		}
	}
	
}) ;
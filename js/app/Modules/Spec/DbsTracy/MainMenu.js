Ext.define('DbsTracyMenuItemModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'item_disabled',  type: 'boolean'},
		{name: 'type_header',  type: 'boolean'},
		{name: 'type_separator',   type: 'boolean'},
		{name: 'type_action',   type: 'boolean'},
		{name: 'type_action_blank',   type: 'boolean'},
		{name: 'separator_label',   type: 'string'},
		{name: 'action_iconCls',   type: 'string'},
		{name: 'action_qtip',   type: 'string'},
		{name: 'action_caption',   type: 'string'},
		{name: 'action_sendEvent', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsTracy.MainMenu',{
	extend:'Ext.view.View',
	requires:[
	],
	
	initComponent: function() {
		 var viewItemTpl = new Ext.XTemplate(
			'<tpl for=".">',
			'<tpl if="!item_disabled">',
			'<div class="op5-spec-dbstracy-mainmenu-item">',
				'<tpl if="type_header">',
					'<div class="op5-spec-dbstracy-mainmenu-header"></div>',
				'</tpl>',
				
				'<tpl if="type_separator">',
					'<div class="x-clear"></div>',
					'<div class="op5-spec-dbstracy-mainmenu-separator">{separator_label}</div>',
				"</tpl>",
			
				'<tpl if="type_action">',
					'<tpl if="!type_action_blank">',
						'<div class="op5-spec-dbstracy-mainmenu-action op5-spec-dbstracy-mainmenu-action-active">',
							'<div class="op5-spec-dbstracy-mainmenu-action-icon {action_iconCls}" data-qtip="{action_qtip:htmlEncode}"></div>',
							'<span>{action_caption:htmlEncode}</span>',
						'</div>',
					'</tpl>',
					'<tpl if="type_action_blank">',
						'<div class="op5-spec-dbstracy-mainmenu-action">',
						'</div>',
					'</tpl>',
				'</tpl>',
			'</div>',
			'</tpl>',
			'<tpl if="item_disabled">',
				'<div class="op5-spec-dbstracy-mainmenu-item" style="display:none">',
				'&#160;',
				'</div>',
			'</tpl>',
			'</tpl>'
		);
		 
		var itemsStoreData = [] ;
		if( true ) {
			itemsStoreData.push(
				{type_header:true},
				{type_separator:true, separator_label: 'Files Management'},
				{type_action:true, action_caption: 'Transport Files', action_sendEvent:'files', action_iconCls:'op5-spec-dbstracy-mmenu-files'},
				{type_action:true, action_caption: 'Unsorted attachments', action_sendEvent:'attachments', action_iconCls:'op5-spec-dbstracy-mmenu-attachments'},
				{type_action:true, type_action_blank:true},
				{type_action:true, action_caption: 'Live Validation', action_sendEvent:'panel_live', action_iconCls:'op5-spec-dbslam-menu-live'}
			);
		}
		if( Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN') || Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('GOM') ) {
			itemsStoreData.push(
				{type_separator:true, separator_label: 'Data sources'},
				{type_action:true, action_caption: 'Upload / Sync', action_sendEvent:'form_upload', action_iconCls:'op5-spec-dbstracy-mmenu-upload', item_disabled:!(Optima5.Modules.Spec.DbsTracy.HelperCache.authHelperQueryPage('ADMIN'))},
				{type_action:true, action_caption: 'Specific reports', action_sendEvent:'form_report', action_iconCls:'op5-spec-dbstracy-mmenu-attachments'},
				{type_action:true, action_caption: 'Réinitialisation Demo', action_sendEvent:'form_copydemo', action_iconCls:'op5-spec-dbstracy-mmenu-warning', item_disabled: !Optima5.Helper.getApplication().desktopGetCfgIsDev()}
			);
		}
		 
		var itemsStore = Ext.create('Ext.data.Store',{
			model: 'DbsTracyMenuItemModel',
			data: itemsStoreData
		}) ;
		 
		Ext.apply(this,{
			cls: 'op5-spec-dbstracy-mainmenu',
			tpl: viewItemTpl,
			itemSelector: 'div.op5-spec-dbstracy-mainmenu-item',
			overItemCls: 'op5-spec-dbstracy-mainmenu-item-over',
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

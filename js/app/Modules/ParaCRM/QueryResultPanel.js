Ext.define('Optima5.Modules.ParaCRM.QueryResultPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	ajaxBaseParams:{},
	RES_id: '',
			  
	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			border:false,
			layout: 'fit',
			autoDestroy: true,
					  
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: ['->',{
					xtype:'button',
					text: 'Export Excel',
					icon: 'images/op5img/ico_save_16.gif'
				}]
			}]
		}) ;

		this.callParent() ;
		
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'res_get',
			RES_id:me.RES_id
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					me.destroy() ;
				}
				else {
					var ajaxData = Ext.decode(response.responseText) ;
					me.initAddToolbar( ajaxData ) ;
					me.initAddGrids( ajaxData ) ;
				}
			},
			scope: me
		});
	},
	initAddToolbar:function( ajaxData ){
		var dockedTopToolbar = this.query('toolbar')[0] ;
	},
	initAddGrids:function( ajaxData ){
		var me = this ;
		
		var tabitems = new Array() ;
		var columns = null ;
		var fields = null ;
		Ext.Array.each( ajaxData.tabs , function(tabData) {
			columns = [] ;
			fields = [] ;
			Ext.Array.each(tabData.columns, function(columnDef) {
				if( columnDef.text_bold == true ) {
					columnDef.text = '<b>'+columnDef.text+'</b>' ;
				}
				if( columnDef.text_italic == true ) {
					columnDef.text = '<i>'+columnDef.text+'</i>' ;
				}
				if( columnDef.is_bold == true ) {
					Ext.apply(columnDef,{
						renderer: function(value) {
							return '<b>'+value+'</b>' ;
						}
					}) ;
				}
				columns.push(columnDef);
				
				fields.push({
					name:columnDef.dataIndex,
					type:columnDef.dataType
				});
			},me); 
			
			tabitems.push({
				xtype:'grid',
				title:tabData.tab_title,
				columns:columns,
				store:{
					fields:fields,
					data:tabData.data
				}
			});
			
		},me) ;
		
		me.add({
				xtype:'tabpanel' ,
				//frame: true,
				border:false,
				activeTab: 0,
				defaults :{
						// bodyPadding: 10
				},
				items: tabitems
			}) ;
	}
}) ;
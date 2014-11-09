Ext.define('QwebQwhereModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'qweb_fieldqwhere_desc', type: 'string'},
		{name: 'target_resource_qweb_key',  type: 'string'},
		{name: 'qfield_type',   type: 'string'},
		{name: 'qfield_linkbible',   type: 'string'},
		{name: 'condition_string',   type: 'string'},
		{name: 'condition_date_lt',   type: 'string'},
		{name: 'condition_date_gt',   type: 'string'},
		{name: 'condition_num_lt',   type: 'number'},
		{name: 'condition_num_gt',   type: 'number'},
		{name: 'condition_num_eq',   type: 'number'},
		{name: 'condition_bible_mode',   type: 'string'},
		{name: 'condition_bible_treenodes',   type: 'string'},
		{name: 'condition_bible_entries',   type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.QwebSubpanelQwhere' ,{
	extend: 'Optima5.Modules.CrmBase.QwebSubpanel',
			  
	alias: 'widget.op5crmbaseqwebqwhere',
			  
	requires: [
		'Optima5.Modules.CrmBase.QwebSubpanel',
		'Optima5.Modules.CrmBase.QueryWhereFormBible',
		'Optima5.Modules.CrmBase.QueryWhereFormDate'
	] ,
			  
	qwhereFields : [] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			title: '"Where?" / Query Conditions' ,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true ,
			items: [ Ext.apply(me.initComponentCreateGrid(),{
				flex:2 
			}),Ext.apply(me.initComponentCreateFormpanel(),{
				flex:3
			})]
		}) ;
		
		me.callParent() ;
		
		me.setFormpanelRecord(null) ;
	},
	initComponentCreateGrid: function() {
		var me = this ;
		
		me.store = Ext.create('Ext.data.Store',{
			autoLoad: true,
			sortOnLoad: false,
			sortOnFilter: false,
			model: 'QwebQwhereModel',
			data : me.qwhereFields ,
			proxy: {
				type: 'memory'
			}
		}) ;
		
		me.grid = Ext.create('Ext.grid.Panel',{
			store: me.store ,
			sortableColumns: false ,
			columns: [{
				header: 'Field Code',
				menuDisabled: true ,
				flex:1,
				dataIndex: 'field_code',
				renderer: function( value, metaData, record ) {
					if( record.get('qweb_fieldqwhere_desc') && record.get('qweb_fieldqwhere_desc') != '' ) {
						return record.get('qweb_fieldqwhere_desc') ;
					}
					var text = '' //'('+record.get('target_resource_qweb_key')+') ' ;
					switch( record.get('qfield_type') ) {
						case 'link' :
							text += '<u>Link</u>'+' <b>'+record.get('qfield_linkbible')+'</b>' ;
							break ;
							
						case 'date' :
							text = '<u>Date</u>' ;
							break ;
						
						default : 
							text += record.get('qfield_type');
							break ;
					}
					return text ;
				}
			},{
				header: 'Clause',
				menuDisabled: true ,
				flex:1 ,
				renderer: function( value, metaData, record ) {
					switch( record.get('qfield_type') ) {
						case 'link' :
							switch( record.get('condition_bible_mode') ) {
								case 'SINGLE' :
									return '<i>Unique / Last occurence</i>' ;
								
								case 'SELECT' :
									if( record.get('condition_bible_entries') && Ext.JSON.decode( record.get('condition_bible_entries') ).length > 0 ) {
										return '<b>E:</b>' + '&#160;' + Ext.JSON.decode( record.get('condition_bible_entries') ).join(' ') ;
									}
									if( record.get('condition_bible_treenodes') && Ext.JSON.decode( record.get('condition_bible_treenodes') ).length > 0 ) {
										return '<b>T:</b>' + '&#160;' + Ext.JSON.decode( record.get('condition_bible_treenodes') ).join(' ') ;
									}
								default :
									return '<b>not set</b>' ;
							}
							break ;
							
						case 'date' :
							if( record.get('condition_date_lt') == '' && record.get('condition_date_gt') == '' ) {
								return '<b>not set</b>' ;
							}
							
							var str = '' ;
							if( record.get('condition_date_gt') != '' )
							{
								str = str + record.get('condition_date_gt') + ' < ' ;
							}
							str = str + '<b>X</b>' ;
							if( record.get('condition_date_lt') != '' )
							{
								str = str + ' < ' + record.get('condition_date_lt') ;
							}
							return str ;
						
						case 'number' :
							if( record.get('condition_num_lt') == 0 && record.get('condition_num_gt') == 0 ) {
								return '<b>not set</b>' ;
							}
							
							var str = '' ;
							str = str + record.get('condition_num_gt') + ' < ' ;
							str = str + '<b>X</b>' ;
							str = str + ' < ' + record.get('condition_num_lt') ;
							return str ;
						
						default :
							return value ;
					}
				}
			}]
		}) ;
		me.grid.on('itemclick', function( view, record, item, index, event ) {
			me.setFormpanelRecord( record ) ;
		},me) ;
		me.grid.on('itemcontextmenu', function(view, record, item, index, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			var gridContextMenuItems = new Array() ;
			if( true ) {
				gridContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete condition',
					handler : function() {
						me.setFormpanelRecord(null) ;
						me.store.remove(record) ;
					},
					scope : me
				});
			}
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems,
				listeners: {
					hide: function(menu) {
						menu.destroy() ;
					}
				}
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		
		return me.grid ;
	},
	initComponentCreateFormpanel: function(){
		var me = this ;
		
		me.formpanel = Ext.create('Ext.panel.Panel',{
			layout:'fit',
			border:false
		}) ;
		
		return me.formpanel ;
	},
	setFormpanelRecord: function( record ){
		var me = this ;
		me.formpanel.removeAll() ;
		if( record === null ) {
			me.formpanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var mform ;
		switch( record.get('qfield_type') ) {
			case 'link' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormBible',{
					optimaModule: me.optimaModule,
					bibleId: record.get('qfield_linkbible') ,
					frame:true
				}) ;
				break ;
				
			case 'date' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormDate',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			case 'number' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormNumber',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			default :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereForm',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
		}
		mform.loadRecord(record) ;
		
		mform.on('change',function(){
			Ext.Object.each( mform.getForm().getValues() , function(k,v){
				switch( k ) {
					case 'condition_bible_mode' :
					case 'condition_bible_treenodes' :
					case 'condition_bible_entries' :
						
					case 'condition_date_gt' :
					case 'condition_date_lt' :
						
					case 'condition_num_gt' :
					case 'condition_num_lt' :
						
						break ;
						
					default :
						return ;
				}
				record.set(k,v) ;
			},me) ;
		},me) ;
		
		me.formpanel.add( mform ) ;
	}
}) ;
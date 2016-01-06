Ext.define('DbsLamCfgSocTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'display_code', string: 'string'},
		{name: 'display_txt', string: 'string'},
		{name: 'display_desc', string: 'string'},
		{name: 'type', type:'string'},
		{name: 'soc_code', type:'string'},
		{name: 'atr_code', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.CfgSocPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.CfgSocForm',
		'Optima5.Modules.Spec.DbsLam.CfgSocAttributeForm'
	],
	
	socStore: null,
	
	initComponent: function() {
		Ext.apply( this,{
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				iconCls: 'op5-spec-dbslam-cfgsoc-apply',
				text: '<b>Apply</b>',
				handler: function(){
					this.handleApply() ;
				},
				scope: this
			}],
			layout: {
				type: 'border',
				align: 'stretch'
			},
			items: [{
				region: 'center',
				flex: 1,
				xtype: 'treepanel',
				title: 'Company > Attribute',
				store: [{
					model: 'DbsLamCfgSocTreeModel',
					root: {root: true, children:[]},
					proxy: {
						type: 'memory' ,
						reader: {
							type: 'json'
						}
					}
				}],
				columns: [{
					xtype: 'treecolumn',
					text: 'Code',
					dataIndex: 'display_code',
					width: 150
				},{
					text: 'Title',
					dataIndex: 'display_txt',
					width: 180
				},{
					text: 'Desc',
					dataIndex: 'display_desc',
					width: 250
				}],
				useArrows: true,
				listeners: {
					itemclick: this.onTreeItemClick,
					itemcontextmenu: this.onTreeContextMenu,
					scope: this
				}
			},{
				region: 'east',
				flex: 1,
				itemId: 'mFormContainer',
				layout: 'fit',
				items: [{
					xtype: 'component',
					cls: 'ux-noframe-bg'
				}]
			}]
		});
		
		this.socStore = Ext.create('Ext.data.Store',{
			model: 'DbsLamCfgSocModel',
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_moduleId: 'spec_dbs_lam',
					_action: 'cfg_getSoc'
				},
				reader: {
					type: 'json',
					rootProperty: 'data'
				}
			}),
			pageSize: 0,
			autoLoad: false
		}) ;
		
		this.callParent() ;
		this.doLoad() ;
	},
	doLoad: function() {
		this.socStore.on('load',function(store){
			this.buildRootNode() ;
		},this) ;
		this.socStore.load() ;
	},
	
	buildRootNode: function() {
		var rootChildren = [] ;
		this.socStore.each( function(socRecord) {
			var socAttributes = [] ;
			socRecord.attributes().each( function(atrRecord) {
				var desc = '<b>Link:</b>&#160;' ;
				if( atrRecord.get('use_prod') ) {
					desc += 'Products' ;
				} else if( atrRecord.get('use_stock') ) {
					desc += 'Stock' ;
				}
				if( atrRecord.get('use_adr') ) {
					desc += '&#160;' + '>> Locations' ;
				}
				
				socAttributes.push({
					leaf: true,
					display_code: ''+atrRecord.get('atr_code')+'',
					display_txt: ''+atrRecord.get('atr_txt')+'',
					display_desc: desc,
					type: 'attribute',
					soc_code: socRecord.get('soc_code'),
					atr_code: atrRecord.get('atr_code')
				});
			}) ;
			
			rootChildren.push({
				expanded: true,
				display_code: '<b>'+socRecord.get('soc_code')+'</b>',
				display_txt: '<b>'+socRecord.get('soc_txt')+'</b>',
				type: 'soc',
				soc_code: socRecord.get('soc_code'),
				children: socAttributes
			})
		}) ;
		
		this.down('treepanel').setRootNode({
			icon: 'images/op5img/ico_storeview_16.png',
			root: true,
			expanded: true,
			display_code: '<u>Companies</u>',
			type: 'root',
			children: rootChildren
		});
	},
	
	handleNewSoc: function() {
		this.setNullRecord() ;
		var tmpRecord = this.socStore.add( {soc_code:null} )[0] ;
		this.setSocRecord( tmpRecord ) ;
	},
	handleNewAttribute: function( socCode ) {
		this.setNullRecord() ;
		var socRecord = this.socStore.getById( socCode ) ;
		var tmpRecord = socRecord.attributes().add( {atr_code:null} )[0] ;
		this.setSocAttributeRecord(socRecord,tmpRecord) ;
	},
	handleDeleteSoc: function( socCode ) {
		this.setNullRecord() ;
		var socRecord = this.socStore.getById( socCode ) ;
		this.socStore.remove( socRecord ) ;
		this.buildRootNode() ;
	},
	handleDeleteAttribute: function( socCode, atrCode ) {
		this.setNullRecord() ;
		var socRecord = this.socStore.getById( socCode ) ;
		var atrRecord = socRecord.attributes().getById( atrCode ) ;
		socRecord.attributes().remove(atrRecord) ;
		this.buildRootNode() ;
	},
	
	
	
	onTreeItemClick: function(view, record, item, index, event) {
		this.setNullRecord() ;
		switch( record.get('type') ) {
			case 'attribute' :
				var socRecord = this.socStore.getById( record.get('soc_code') ) ;
				var atrRecord = socRecord.attributes().getById( record.get('atr_code') ) ;
				this.setSocAttributeRecord( socRecord, atrRecord ) ;
				break ;
				
			case 'soc' :
				var socRecord = this.socStore.getById( record.get('soc_code') ) ;
				this.setSocRecord( socRecord ) ;
				break ;
			
			default :
				this.setNullRecord() ;
				break ;
		}
	},
	onTreeContextMenu: function(view, record, item, index, event) {
		var treeContextMenuItems = new Array() ;
		
		switch( record.get('type') ) {
			case 'root' :
				treeContextMenuItems.push({
					iconCls: 'icon-bible-new',
					text: 'Define company',
					handler : function() {
						this.handleNewSoc() ;
					},
					scope : this
				});
				break ;
				
			case 'soc' :
				treeContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete <b>'+record.get('soc_code')+'</b> company',
					handler : function() {
						this.handleDeleteSoc( record.get('soc_code') ) ;
					},
					scope : this
				});
				treeContextMenuItems.push('-') ;
				treeContextMenuItems.push({
					iconCls: 'icon-bible-new',
					text: 'New attribute on '+record.get('soc_code'),
					handler : function() {
						this.handleNewAttribute( record.get('soc_code') ) ;
					},
					scope : this
				});
				break ;
				
			case 'attribute' :
				treeContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete <b>'+record.get('atr_code')+'</b> attribute',
					handler : function() {
						this.handleDeleteAttribute( record.get('soc_code'), record.get('atr_code') ) ;
					},
					scope : this
				});
				break ;
			
			default :
				return ;
		}
		
		var treeContextMenu = Ext.create('Ext.menu.Menu',{
			items : treeContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		
		treeContextMenu.showAt(event.getXY());
	},
	
	
	setNullRecord: function() {
		var me = this,
			eastpanel = me.getComponent('mFormContainer') ;
		if( eastpanel.down() instanceof Optima5.Modules.Spec.DbsLam.CfgForm ) {
			eastpanel.down().handleDismiss() ;
		}
		eastpanel.removeAll() ;
		eastpanel.add({xtype:'component', cls: 'ux-noframe-bg'}) ;
	},
	setSocRecord: function(socRecord) {
		var me = this,
			eastpanel = me.getComponent('mFormContainer') ;
		eastpanel.removeAll() ;
		
		var title = '' ;
		if( !socRecord.phantom ) {
			title += socRecord.get('soc_code') ;
		} else {
			title += '<i>new attribute</i>' ;
		}
		
		var formPanel = Ext.create( 'Optima5.Modules.Spec.DbsLam.CfgSocForm',{
			border: false,
			optimaModule: this.optimaModule,
			title: title,
			listeners: {
				saved: function(formPanel) {
					this._modified = true ;
					this.setNullRecord();
					this.buildRootNode() ;
				},
				scope:me
			}
		});
		formPanel.setRecord(socRecord) ;
		eastpanel.add(formPanel) ;
	},
	setSocAttributeRecord: function(socRecord,atrRecord) {
		var me = this,
			eastpanel = me.getComponent('mFormContainer') ;
		eastpanel.removeAll() ;
		
		var title = socRecord.get('soc_code') ;
		title += ' >> ' ;
		if( !atrRecord.phantom ) {
			title += atrRecord.get('atr_code') ;
		} else {
			title += '<i>new attribute</i>' ;
		}
		
		var formPanel = Ext.create( 'Optima5.Modules.Spec.DbsLam.CfgSocAttributeForm',{
			border: false,
			optimaModule: this.optimaModule,
			title: title,
			listeners: {
				saved: function(formPanel) {
					this._modified = true ;
					this.setNullRecord();
					this.buildRootNode() ;
				},
				scope:me
			}
		});
		formPanel.setRecord(socRecord,atrRecord) ;
		eastpanel.add(formPanel) ;
	},
	
	doQuit: function() {
		if( this._modified ) {
			Ext.Msg.confirm('Quit','Discard changes ?', function(btn) {
				if( btn == 'yes' ) {
					this.destroy() ;
				}
				if( btn == 'no' ) {
					return ;
				}
			},this) ;
		} else {
			this.destroy() ;
		}
	},
	handleApply: function() {
		Ext.Msg.confirm('Confirm','Apply new global configuration ?', function(btn) {
			if( btn == 'yes' ) {
				this.doApply() ;
			}
			if( btn == 'no' ) {
				return ;
			}
		},this) ;
	},
	doApply: function() {
		var arrSocs = [] ;
		this.socStore.each( function(socRecord) {
			arrSocs.push(socRecord.getData(true)) ;
		}) ;
		console.dir(arrSocs) ;
		
		var params = {
			_moduleId: 'spec_dbs_lam',
			_action: 'cfg_applySoc'
		};
		Ext.apply( params, {
			data: Ext.JSON.encode(arrSocs)
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function() {
				this._modified = false ;
				this.setNullRecord() ;
			},
			scope: this
		});
		
		
	}
});
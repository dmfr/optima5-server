Ext.define('Optima5.Modules.Spec.DbsLam.GunContainersFilters',{
	extend:'Ext.tab.Panel',
	initComponent: function(){
		Ext.apply(this,{
			tbar: ['->',{
				itemId: 'tbAdd',
				iconCls: 'op5-spec-dbslam-transfer-add',
				text: '<b>Filters</b>',
				handler: function() {
					this.fireEvent('quit') ;
				},
				scope: this
			}],
			activeTab: 0,
			items: [{
				xtype: 'treepanel',
				itemId: 'tpDocuments',
				title: 'Documents',
				store: {
					model: 'DbsLamTransferTreeModel',
					root:{},
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					},
					listeners: {
						load: function(store) {
							/*
							if( store.getNodeById(this.whseCode) ) {
								store.setRootNode( store.getNodeById(this.whseCode).copy(undefined,true) ) ;
							}*/
							store.getRoot().cascadeBy(function(node){
								node.set('checked',false) ;
							}) ;
						},
						scope: this
					}
				},
				collapsible: false,
				useArrows: false,
				rootVisible: true,
				multiSelect: false,
				singleExpand: false,
				columns: {
					defaults: {
						menuDisabled: false,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: true,
						groupable: false,
						lockable: false
					},
					items: [{
						xtype:'treecolumn',
						dataIndex: 'display_txt',
						text: 'Document ID',
						width: 250
					}]
				},
			},{
				xtype: 'treepanel',
				title: 'Locations',
				store: {
					model: 'DbsLamStockTreeModel',
					root:{
						iconCls:'task-folder',
						expanded:true,
						treenode_key:'&',
						field_ROW_ID: 'Warehouse zones'
					},
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_action: 'data_getBibleTree',
							bible_code: 'ADR'
						}
					}),
					listeners: {
						load: function(store) {
							/*
							if( store.getNodeById(this.whseCode) ) {
								store.setRootNode( store.getNodeById(this.whseCode).copy(undefined,true) ) ;
							}*/
							store.getRoot().cascadeBy(function(node){
								node.set('checked',false) ;
							}) ;
							store.getRoot().set('checked',true) ;
						},
						scope: this
					}
				},
				collapsible: false,
				useArrows: false,
				rootVisible: true,
				multiSelect: false,
				singleExpand: false,
				columns: {
					defaults: {
						menuDisabled: false,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items: [{
						xtype:'treecolumn',
						dataIndex: 'field_ROW_ID',
						text: 'ID',
						width: 200,
						renderer: function(v,m,r) {
							if( r.isRoot() ) {
								return '<b>'+v+'</b>';
							} else {
								return v ;
							}
						}
					},{
						dataIndex: 'field_POS_ZONE',
						text: 'Zone',
						width: 50
					},{
						dataIndex: 'field_POS_ROW',
						text: 'Allée',
						width: 50
					}]
				}
			}]
		}) ;
		this.callParent() ;
		this.doLoadDocuments() ;
	},
	doLoadDocuments: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_getTransfer'
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var transferChildren = [] ;
				Ext.Array.each( ajaxResponse.data, function(transferDoc) {
					transferChildren.push({
						leaf: true,
						type: 'transfer',
						display_txt: transferDoc.transfer_txt,
						transfer_filerecord_id: transferDoc.transfer_filerecord_id,
						step_code: transferDoc.step_code,
						status_is_on: transferDoc.status_is_on,
						status_is_ok: transferDoc.status_is_ok,
						whse_src: transferDoc.whse_src,
						whse_dest: transferDoc.whse_dest,
						flow_code: transferDoc.flow_code
					}) ;
				}) ;
				
				var treepanel = this.down('#tpDocuments') ;
				treepanel.getStore().setRootNode({
					root: true,
					iconCls:'task-folder',
					expanded:true,
					display_txt: '<b>Transfers</b>',
					children: transferChildren
				}) ;
				treepanel.getRootNode().cascadeBy( function(node) {
					node.set('checked',false) ;
				}) ;
			},
			scope: this
		}) ;
	}
}) ;

Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70selectTrspt',{
	extend:'Ext.grid.Panel',
	requires: [
		'Ext.grid.column.Action'
	],
	mixins: {
		gunfilter: 'Optima5.Modules.Spec.DbsTracy.GunFiltersMixin',
		loadmaskable: 'Optima5.Modules.Spec.DbsTracy.GunLoadmaskableMixin'
	},
	initComponent: function(){
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'->',{
				itemId: 'btnFilters',
				iconCls: 'op5-spec-dbslam-transfer-add',
				textBase: 'Filters',
				text: '',
				handler: function() {
					this.openFilters() ;
				},
				scope: this
			}],
			bbar : [{
				xtype:'textfield',
				itemId: 'txtScan',
				flex:1,
				listeners : {
					specialkey: function(field, e){
						if (e.getKey() == e.ENTER) {
							this.handleScan() ;
						}
					},
					scope: this
				}
			},{
				xtype:'button',
				text: 'Send',
				handler : function(button,event) {
					this.handleScan() ;
				},
				scope : this
			}],
			store: {
				model: 'DbsTracyGunTracySelectTrspt',
				autoLoad: true,
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			columns: [{
				xtype: 'actioncolumn',
				align: 'center',
				width: 36,
				items: [{
					icon: 'images/modules/crmbase-plugin-22.png',  // Use a URL in the icon config
					tooltip: 'Take',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.openTransferLig( rec.get('transferlig_filerecord_id') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'container_ref',
				text: 'Container',
			},{
				dataIndex: 'stk_prod',
				width: 150,
				text: 'P/N'
			},{
				dataIndex: 'src_adr',
				text: 'Pos.From'
			},{
				dataIndex: 'dst_adr',
				text: 'Pos.Dest'
			}]
		});
		this.callParent() ;
		this.mixins.gunfilter.constructor.call(this);
		this.mixins.loadmaskable.constructor.call(this);
		
		this.onFilterChanged() ;
		//this.doLoad() ;
	},
	handleScan: function() {
		var containerRef = this.down('#txtScan').getValue() ;
		containerRef = containerRef.trim().toUpperCase() ;
		
		var transferligFilerecordId = null ;
		this.getStore().each( function(rec) {
			if( rec.get('container_ref') == containerRef ) {
				transferligFilerecordId = rec.get('transferlig_filerecord_id') ;
			}
		}) ;
		if( transferligFilerecordId ) {
			this.openTransferLig(transferligFilerecordId) ;
			return ;
		}
		this.getStore().load() ;
	},
	openTransferLig: function(transferligFilerecordId) {
		this.fireEvent('opentransferlig',this,transferligFilerecordId) ;
	},
	
	onGridBeforeLoad: function() {
		
	},
	onGridLoad: function() {
		this.down('#txtScan').focus() ;
	},
	
	openFilters: function() {
		this.openModalFilters() ;
	},
	onFilterChanged: function() {
		// update Button
		var filterArr = [] ;
		Ext.Object.each( this.getFilterValues(), function(k,v) {
			filterArr.push(v) ;
		});
		this.down('#btnFilters').setText( Ext.isEmpty(filterArr) ? this.down('#btnFilters').textBase : '<b>'+filterArr.join(',')+'</b>' ) ;
		
		this.doLoad() ;
	},
	
	doLoad: function() {
		this.showLoadmask() ;
		
		var filterParams = this.getFilterValues() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: Ext.apply({
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_getTrsptList'
			},filterParams),
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData) {
		console.dir(ajaxData) ;
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	},
	
	

}) ;

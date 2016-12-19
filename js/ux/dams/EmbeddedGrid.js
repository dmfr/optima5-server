Ext.define('Ext.ux.dams.EmbeddedGrid',{
	extend : 'Ext.grid.Panel',
			  
	alias : 'widget.damsembeddedgrid',
			  
	translateCache : [] , // SUPER CRADE !!!
			  
	initComponent: function(){
		var modelfields = new Array() ;
		var modelvalidators = new Object() ;
		Ext.each( ( Ext.isObject(this.columns) ? this.columns.items : this.columns ), function( v ){
			var type, dateFormat=null ;
			if( v.type=='hidden' ) {
				return ;
			}
			if( !v.type || !Ext.ClassManager.getByAlias( Ext.data.Field.prototype.aliasPrefix + v.type ) ) {
				type = 'string' ;
			} else {
				type = v.type ;
			}
			if( v.type == 'date' ) {
				dateFormat = 'Y-m-d H:i:s' ;
			}
			modelfields.push( { name:v.dataIndex, type:type, dateFormat:dateFormat, defaultValue:((typeof v.defaultValue === 'undefined')? '' : v.defaultValue ) } ) ;
			if( v.editor && v.editor.allowBlank == false ) {
				modelvalidators[v.dataIndex] = {type:'length',min:1} ;
			}
		});
		this.modelname = this.id+'-'+'dynModel' ;
		Ext.define(this.modelname,{
			extend: 'Ext.data.Model',
			fields: modelfields,
			validators: modelvalidators
		}) ;
		
		
		// creation du store uniquement !!
		this.linkstore = Ext.create('Ext.data.Store', {
			autoLoad: true,
			autoSync: true,
			model: this.modelname,
			data: this.tabData || [],
			proxy: Ext.create('Ext.data.proxy.Memory',{
				updateOperation: function(operation, callback, scope) {
					operation.setCompleted();
					operation.setSuccessful();
					Ext.callback(callback, scope || me, [operation]);
				}
			})
		}) ;
		Ext.apply(this,{
			// frame: true,
			//minHeight:300,
			store: this.linkstore
		}) ;
		
		if( !this.readOnly ) {
			this.rowEditing = Ext.create('Ext.grid.plugin.RowEditing',{pluginId:'rowEditor'});
			this.rowEditing.on('canceledit',this.onCancelEdit,this) ;
			this.rowEditing.on('edit',this.onAfterEdit,this) ;
			Ext.apply(this,{
				plugins: [this.rowEditing]
			}) ;
			Ext.apply(this,{
				dockedItems: [{
					xtype: 'toolbar',
					items: [{
						itemId: 'add',
						text: 'Add',
						iconCls: 'icon-add',
						handler: function(){
							this.onBtnAdd({}) ;
						},
						scope: this,
						menu: []
					}, '-', {
						itemId: 'delete',
						text: 'Delete',
						iconCls: 'icon-delete',
						disabled: true,
						handler: function(){
							this.onBtnDelete() ;
						},
						scope: this
					}]
				}]
			});
		}
		
		this.on('destroy',function(p){
			Ext.ux.dams.ModelManager.unregister( p.modelname ) ;
		},this) ;
		
		this.callParent() ;
		
		if( !this.readOnly ) {
			this.getSelectionModel().on('selectionchange', function(selModel, selections){
				this.down('#delete').setDisabled(selections.length === 0);
			},this);
		}
	},
					 
	testFn: function( mfield, mvalue ){
		console.log( mfield + ' ' + mvalue ) ;
	},
			  
	getLinkStore : function(){
		return this.linkstore ;
	},
			  
	getSelectedRowIndex: function(){
		if( this.getSelectionModel().getCount() == 0 )
			return -1 ;
			
		var r = this.getSelectionModel().getSelection();
		var s = this.getStore();
		return s.indexOf(r[0]);
   },
	
	setTabData: function( tabData ) {
		var ln = tabData.length,
			records = [],
			i = 0;
		for (; i < ln; i++) {
			// Mod 2014-03 : assign ID if not set, to set existing record as NOT phantom
			if( !(tabData[i].id) ) {
				tabData[i]['id'] = i+1 ;
			}
			records.push(Ext.create(this.modelname, tabData[i]));
		}
		this.linkstore.loadData(records) ;
	},
	getTabData: function() {
		var datar = new Array();
		var jsonDataEncode = "";
		var records = this.linkstore.getRange();
		for (var i = 0; i < records.length; i++) {
			datar.push(records[i].data);
		}
		return datar ;
	},
			  
	onCancelEdit : function(editor, editObject){
		var store = editObject.store,
			record = editObject.record ;
		if( record.phantom ) {
			// Mod 2014-03 : if phantom set, remove record
			store.remove(record) ;
		}
		this.linkstore.sync() ;
	},
	onAfterEdit: function(editor, editObject) {
		var record = editObject.record ;
		// Mod 2014-03 : now actual record, unset phantom
		record.phantom = false ;
		this.getView().getSelectionModel().deselectAll( true ) ;
		this.fireEvent('edited') ;
	},
	
	onBtnAdd: function( newRecordValues ) {
		var newRecordIndex = this.getSelectedRowIndex() ;
		if( newRecordIndex == -1 ) {
			newRecordIndex = this.linkstore.getCount() ;
		}
		
		var newModel = Ext.create(this.modelname,newRecordValues) ;
		
		this.linkstore.insert(newRecordIndex, newModel );
		this.linkstore.sync() ;
		
		// Mod 2014-03 : safely set "phantom" explicitly
		newModel.phantom = true ;
		
		this.rowEditing.startEdit(newRecordIndex, 0);
	},
	onBtnDelete: function() {
		var selection = this.getView().getSelectionModel().getSelection()[0];
		if (selection) {
			this.linkstore.remove(selection);
			this.linkstore.sync() ;
			this.fireEvent('edited') ;
		}
	}
});

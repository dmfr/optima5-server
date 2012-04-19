Ext.define('Ext.ux.dams.RestfulGrid',{
	extend : 'Ext.grid.Panel',
			  
	alias : 'widget.damsrestfulgrid',
			  
	translateCache : [] , // SUPER CRADE !!!
			  
	initComponent: function(){
		var me = this ;
		
		var modelfields = new Array() ;
		var modelvalidations = new Array() ;
		Ext.each( this.columns, function( v ){
			var type = 'string' ;
			if( v.type ) {
				type = v.type ;
			}
			modelfields.push( { name:v.dataIndex, type:type, defaultValue:((typeof v.defaultValue === 'undefined')? '' : v.defaultValue ) } ) ;
			if( v.editor && v.editor.allowBlank == false )
				modelvalidations.push( {type:'length',field:v.dataIndex,min:1} ) ;
		});
		this.modelname = this.id+'-'+'dynModel' ;
		Ext.define(this.modelname,{
			extend: 'Ext.data.Model',
			fields: modelfields,
			validations: modelvalidations
		}) ;
		
		
		
		this.rowEditing = Ext.create('Ext.grid.plugin.RowEditing');
		this.rowEditing.on('canceledit',this.onCancelEdit,this) ;
		
		
		// creation du store uniquement !!
		this.linkstore = Ext.create('Ext.data.Store', {
			autoLoad: false,
			autoSync: false,
			model: this.modelname,
			proxy: {
				type: 'ajax',
				url: this.url,
				reader: {
					type: 'json',
					root: 'data'
				}
			}
		}) ;
		Ext.apply(this.linkstore.proxy.actionMethods,{
			read:'POST' 
		}) ;
		
		
		Ext.apply(this,{
			plugins: [this.rowEditing],
			// frame: true,
			//minHeight:300,
			store: this.linkstore,
			dockedItems: [{
				xtype: 'toolbar',
				items: [{
					text: 'Add',
					iconCls: 'icon-add',
					handler: function(){
						var newRecordIndex = ( this.getSelectedRowIndex() + 1 ) ;
						
						this.linkstore.insert(newRecordIndex, Ext.create(this.modelname) );
						this.rowEditing.startEdit(newRecordIndex, 0);
					},
					scope: this
				}, '-', {
					itemId: 'delete',
					text: 'Delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = this.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							this.linkstore.remove(selection);
						}
					},
					scope: this
				}]
			}]
		});
		
		this.getSelectionModel().on('selectionchange', function(selModel, selections){
			this.down('#delete').setDisabled(selections.length === 0);
		},this);
		
		this.on('destroy',function(){
			var model = Ext.ModelManager.getModel(this.modelname);
			Ext.ModelManager.unregister(model);
		},this) ;
		
		this.callParent() ;
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
	
	load : function() {
		this.linkstore.proxy.extraParams = new Object() ;
		Ext.apply( this.linkstore.proxy.extraParams, this.baseParams ) ;
		Ext.apply( this.linkstore.proxy.extraParams, this.loadParams ) ;
		this.linkstore.load() ;
	},
			  
	onCancelEdit : function(){
		var isnull = false ;
		var records = this.linkstore.getRange();
		var model = this.modelname ;
		for (var i = 0; i < records.length; i++) {
			isnull = true ;
			Ext.Object.each(records[i].data, function(k,v){
				if( v ){
					isnull = false ;
				}
			},this) ;
			if( records[i].validate().getCount() > 0 )
				this.linkstore.remove(records[i]) ;
		}
	},
			  
	save : function(callback,callbackScope) {
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		var datar = new Array();
		var jsonDataEncode = "";
		var records = this.linkstore.getRange();
		for (var i = 0; i < records.length; i++) {
			datar.push(records[i].data);
		}
		jsonDataEncode = Ext.JSON.encode(datar);
		
		//jsonData = Ext.encode(Ext.pluck(this.linkstore.data.items, 'data'));
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, this.baseParams ) ;
		Ext.apply( ajaxParams, this.saveParams ) ;
		Ext.apply( ajaxParams, {data:jsonDataEncode} ) ;
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams,
			succCallback : callback,
			scope: callbackScope
		});
	}
			  
	
});